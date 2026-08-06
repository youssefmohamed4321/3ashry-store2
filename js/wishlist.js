const wishlistContainer = document.getElementById("wishlistItems");
const token = localStorage.getItem("token");
let wishlist = [];

if(!token){
wishlistContainer.innerHTML = "<h2>Please log in to view your wishlist.</h2><a href='login.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Log In</a>";
}else{
loadWishlist();
}

async function loadWishlist(){
try{
const res = await fetch(`${API_URL}/users/wishlist`,{
headers:{ "Authorization":"Bearer "+token }
});
wishlist = await res.json();

if(!res.ok){
wishlistContainer.innerHTML = `<h2>${wishlist.message || "Could not load your wishlist"}</h2>`;
return;
}

renderWishlist();
}catch(err){
wishlistContainer.innerHTML = "<h2>Could not reach the server. Is the backend running?</h2>";
console.error(err);
}
}

function renderWishlist(){
wishlistContainer.innerHTML = "";

if(wishlist.length === 0){
wishlistContainer.innerHTML = "<h2>Your wishlist is empty.</h2><a href='index.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Continue Shopping</a>";
return;
}

wishlist.forEach((p)=>{
wishlistContainer.innerHTML += `
<div class="cart-item">
<img src="${(p.images && p.images[0]) || ""}" alt="${p.name}" onerror="this.style.display='none'">
<div class="cart-info">
<h3>${p.name}</h3>
<p>${p.team || ""}</p>
<div class="cart-price">
${p.price} EGP
</div>
</div>
<div style="display:flex;flex-direction:column;gap:10px;">
<button class="btn btn-primary" onclick="moveToCart('${p._id}')">
Add To Cart
</button>
<button class="remove" onclick="removeFromWishlist('${p._id}')">
Remove
</button>
</div>
</div>
`;
});
}

async function removeFromWishlist(productId){
try{
const res = await fetch(`${API_URL}/users/wishlist/${productId}`,{
method:"DELETE",
headers:{ "Authorization":"Bearer "+token }
});
wishlist = await res.json();
renderWishlist();
}catch(err){
alert("Could not reach the server.");
console.error(err);
}
}

async function moveToCart(productId){
try{
await fetch(`${API_URL}/users/cart`,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},
body: JSON.stringify({ productId, quantity:1 })
});

const res = await fetch(`${API_URL}/users/wishlist/${productId}`,{
method:"DELETE",
headers:{ "Authorization":"Bearer "+token }
});
wishlist = await res.json();
renderWishlist();
}catch(err){
alert("Could not reach the server.");
console.error(err);
}
}
