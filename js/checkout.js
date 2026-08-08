const items=document.getElementById("checkoutItems");
const token = localStorage.getItem("token");
let cart = [];

function toast(message){
const toast=document.createElement("div");
toast.className="toast";
toast.innerHTML=message;
document.body.appendChild(toast);
setTimeout(()=>{ toast.classList.add("show"); },100);
setTimeout(()=>{
toast.classList.remove("show");
setTimeout(()=>{ toast.remove(); },400);
},2500);
}

if(!token){
items.innerHTML = "<h2>Please log in to check out.</h2>";
document.getElementById("checkoutSubtotal").innerHTML = "0 EGP";
document.getElementById("checkoutTotal").innerHTML = "0 EGP";
setTimeout(()=>{ window.location.href="login.html"; },1500);
}else{
loadCart();
}

async function loadCart(){
try{
const res = await fetch(`${API_URL}/users/cart`,{
headers:{ "Authorization":"Bearer "+token }
});
cart = await res.json();

if(!res.ok){
items.innerHTML = `<h2>${cart.message || "Could not load your cart"}</h2>`;
return;
}

renderCheckoutItems();
}catch(err){
items.innerHTML = "<h2>Could not reach the server.</h2>";
console.error(err);
}
}

function renderCheckoutItems(){
items.innerHTML = "";
let total = 0;

if(cart.length === 0){
items.innerHTML = "<h2>Your cart is empty.</h2>";
document.getElementById("checkoutSubtotal").innerHTML = "0 EGP";
document.getElementById("checkoutTotal").innerHTML = "0 EGP";
return;
}

cart.forEach(item=>{
const p = item.product;
if(!p) return;
total += p.price * item.quantity;
items.innerHTML += `
<div class="checkout-item">
<span>
${p.name}${item.size ? " (" + item.size + ")" : ""}
x${item.quantity}
</span>
<span>
${p.price * item.quantity} EGP
</span>
</div>
`;
});

document.getElementById("checkoutSubtotal").innerHTML = total + " EGP";
document.getElementById("checkoutTotal").innerHTML = total + " EGP";
}

document.getElementById("checkoutForm")
.addEventListener("submit",async(e)=>{
e.preventDefault();

if(!token){
toast("Please log in to place an order");
setTimeout(()=>{ window.location.href="login.html"; },1500);
return;
}

if(cart.length===0){
toast("Your cart is empty");
return;
}

const paymentMethod = document.querySelector("#checkoutForm select")?.value || "Cash On Delivery";
const inputs = document.querySelectorAll("#checkoutForm input");
const shippingAddress = `${inputs[4]?.value || ""}, ${inputs[3]?.value || ""}, ${inputs[2]?.value || ""}`;

const total = cart.reduce((sum,item)=> sum + (item.product ? item.product.price * item.quantity : 0), 0);

try{
const res = await fetch(`${API_URL}/orders`,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},
body:JSON.stringify({
products: cart.map(item=>({
product:item.product._id,
name:item.product.name,
quantity:item.quantity,
price:item.product.price,
size:item.size || null
})),
total,
paymentMethod,
shippingAddress
})
});

const data = await res.json();

if(!res.ok){
toast(data.message || "Could not place order");
return;
}

// Clear the cart server-side now that the order exists
await fetch(`${API_URL}/users/cart`,{
method:"DELETE",
headers:{ "Authorization":"Bearer "+token }
});

if(paymentMethod === "Credit Card"){
try{
const payRes = await fetch(`${API_URL}/payment/initiate`,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},
body: JSON.stringify({ orderId: data._id })
});

const payData = await payRes.json();

if(payRes.ok && payData.iframeUrl){
toast("Redirecting to secure payment...");
setTimeout(()=>{
window.location.href = payData.iframeUrl;
},1000);
return;
}else{
toast(payData.message || "Could not start payment. Order saved as Pending.");
}
}catch(err){
toast("Could not reach payment gateway. Order saved as Pending.");
console.error(err);
}
}

toast("🎉 Order Placed Successfully!");
setTimeout(()=>{
window.location.href="index.html";
},1500);

}catch(err){
toast("Could not reach the server");
console.error(err);
}
});
