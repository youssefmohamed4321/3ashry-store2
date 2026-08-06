const cartContainer = document.getElementById("cartItems");
const token = localStorage.getItem("token");

if(!token){
cartContainer.innerHTML = "<h2>Please log in to view your cart.</h2><a href='login.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Log In</a>";
document.getElementById("subtotal").innerHTML = "0 EGP";
document.getElementById("total").innerHTML = "0 EGP";
}else{
loadCart();
}

let cart = [];

async function loadCart(){
try{
const res = await fetch(`${API_URL}/users/cart`,{
headers:{ "Authorization":"Bearer "+token }
});
cart = await res.json();

if(!res.ok){
cartContainer.innerHTML = `<h2>${cart.message || "Could not load your cart"}</h2>`;
return;
}

renderCart();
}catch(err){
cartContainer.innerHTML = "<h2>Could not reach the server. Is the backend running?</h2>";
console.error(err);
}
}

function renderCart(){
cartContainer.innerHTML="";
let subtotal=0;

if(cart.length===0){
cartContainer.innerHTML="<h2>Your cart is empty.</h2><a href='index.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Continue Shopping</a>";
document.getElementById("subtotal").innerHTML="0 EGP";
document.getElementById("total").innerHTML="0 EGP";
return;
}

cart.forEach((item)=>{
const p = item.product;
if(!p) return;
subtotal+=p.price*item.quantity;
cartContainer.innerHTML+=`
<div class="cart-item">
<img src="${(p.images && p.images[0]) || ""}" alt="${p.name}" onerror="this.style.display='none'">
<div class="cart-info">
<h3>${p.name}</h3>
<p>${p.team || ""}</p>
<div class="cart-price">
${p.price} EGP
</div>
<div class="quantity">
<button onclick="changeQty('${p._id}',${item.quantity - 1})">-</button>
<span>${item.quantity}</span>
<button onclick="changeQty('${p._id}',${item.quantity + 1})">+</button>
</div>
</div>
<button class="remove"
onclick="removeItem('${p._id}')">
Remove
</button>
</div>
`;
});

document.getElementById("subtotal").innerHTML=subtotal+" EGP";
document.getElementById("total").innerHTML=subtotal+" EGP";
}

async function changeQty(productId, quantity){
if(quantity<1) return;
try{
const res = await fetch(`${API_URL}/users/cart/${productId}`,{
method:"PUT",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},
body: JSON.stringify({ quantity })
});
cart = await res.json();
renderCart();
}catch(err){
alert("Could not reach the server.");
console.error(err);
}
}

async function removeItem(productId){
try{
const res = await fetch(`${API_URL}/users/cart/${productId}`,{
method:"DELETE",
headers:{ "Authorization":"Bearer "+token }
});
cart = await res.json();
renderCart();
}catch(err){
alert("Could not reach the server.");
console.error(err);
}
}
