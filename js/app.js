/*======================================
        LOADER
======================================*/

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.style.display = "none";

        }, 500);

    }

});

/*======================================
        AUTH
======================================*/

function logout(){
localStorage.removeItem("loggedIn");
localStorage.removeItem("token");
localStorage.removeItem("user");
location.href="login.html";
}

const accountBtn=document.getElementById("accountBtn");
const ordersBtn=document.getElementById("ordersBtn");
const adminBtn=document.getElementById("adminBtn");
if(accountBtn){
if(localStorage.getItem("loggedIn")==="true"){
accountBtn.href="account.html";
accountBtn.title="My Account";
if(ordersBtn) ordersBtn.style.display="flex";

try{
const currentUser=JSON.parse(localStorage.getItem("user")||"null");
if(adminBtn && currentUser?.role==="admin"){
adminBtn.style.display="flex";
}
}catch(e){}

}else{
accountBtn.title="Login";
}
}

const searchIconBtn=document.getElementById("searchIconBtn");
searchIconBtn?.addEventListener("click",(e)=>{
e.preventDefault();
document.getElementById("featured")?.scrollIntoView({behavior:"smooth"});
setTimeout(()=>{
document.getElementById("search")?.focus();
},400);
});

/*======================================
        RENDER PRODUCTS
======================================*/

const productsContainer=document.getElementById("products");

let products=[];

function imgPlaceholder(label){

const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='#0B3D2E'/><text x='50%' y='50%' fill='white' font-size='22' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;

return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

}

fetch(`${API_URL}/products?limit=50`)
.then(res=>res.json())
.then(data=>{
products=Array.isArray(data) ? data : data.products;
products=products.map(p=>({
id:p._id,
name:p.name,
team:p.team || "Englishino",
price:p.price,
oldPrice:p.oldPrice,
rating:p.rating,
category:p.category,
image:(p.images && p.images[0]) || "",
badge:p.badge || ""
}));
displayProducts(products);
})
.catch(err=>{
console.error("Could not load products from the backend:",err);
productsContainer.innerHTML="<p class='no-results'>Could not load products. Is the backend running?</p>";
});

function displayProducts(items){
productsContainer.innerHTML="";
if(items.length===0){
productsContainer.innerHTML="<p class='no-results'>No products match your search.</p>";
return;
}
items.forEach(product=>{
productsContainer.innerHTML+=`
<div class="product-card">
<span class="sale">${product.badge}</span>
<a href="product.html?id=${product.id}">
<img src="${product.image}" onerror="this.onerror=null;this.src=imgPlaceholder('${product.team}')">
</a>
<div class="product-info">
<h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
<p>${product.team}</p>
<div class="price">
${product.oldPrice ? `<span class="old">${product.oldPrice} EGP</span>` : ""}
<span class="new">
${product.price} EGP
</span>
</div>
<div class="product-buttons">
<button onclick="addCart('${product.id}')">
<i class="fa-solid fa-cart-shopping"></i>
Add To Cart
</button>
<button class="wishlist"
onclick="addWishlist('${product.id}')">
<i class="fa-regular fa-heart"></i>
</button>
<button onclick="quickView('${product.id}')">
<i class="fa-solid fa-eye"></i>
</button>
</div>
</div>
</div>
`;
});
}

const search=document.getElementById("search");

const categoryFilter=document.getElementById("categoryFilter");

const teamFilter=document.getElementById("teamFilter");

const priceFilter=document.getElementById("priceFilter");

const sortProducts=document.getElementById("sortProducts");

function updateProducts(){

let filtered=[...products];

const category=categoryFilter.value;

const team=teamFilter.value;

const price=priceFilter.value;

const searchValue=search.value.toLowerCase();

if(category!=""){

filtered=filtered.filter(p=>p.category===category);

}

if(team!=""){

filtered=filtered.filter(p=>p.team===team);

}

if(price!=""){

filtered=filtered.filter(p=>p.price<=price);

}

if(searchValue!=""){

filtered=filtered.filter(p=>

p.name.toLowerCase().includes(searchValue)

||

p.team.toLowerCase().includes(searchValue)

);

}

switch(sortProducts.value){

case "low":

filtered.sort((a,b)=>a.price-b.price);

break;

case "high":

filtered.sort((a,b)=>b.price-a.price);

break;

case "name":

filtered.sort((a,b)=>a.name.localeCompare(b.name));

break;

}

displayProducts(filtered);

}

function jumpToCategory(category){

categoryFilter.value=category;

updateProducts();

document.getElementById("featured")?.scrollIntoView({behavior:"smooth"});

}

categoryFilter.addEventListener("change",updateProducts);

teamFilter.addEventListener("change",updateProducts);

priceFilter.addEventListener("change",updateProducts);

sortProducts.addEventListener("change",updateProducts);

search.addEventListener("keyup",updateProducts);

/*======================================
        CATEGORIES MENU
======================================*/

const categoriesBtn=document.getElementById("categoriesBtn");
const categoriesMenu=document.getElementById("categoriesMenu");

categoriesBtn?.addEventListener("click",(e)=>{
e.stopPropagation();
categoriesMenu.classList.toggle("show");
});

document.addEventListener("click",(e)=>{
if(categoriesMenu && !categoriesMenu.contains(e.target) && e.target!==categoriesBtn){
categoriesMenu.classList.remove("show");
}
});

/*======================================
        MOBILE MENU
======================================*/

const menuBtn = document.querySelector(".menu-btn");

const navLinks = document.querySelector(".nav-links");

if(menuBtn){

menuBtn.addEventListener("click",()=>{

navLinks.classList.toggle("active");

});

}

/*======================================
        BACK TO TOP
======================================*/

const topBtn=document.getElementById("backToTop");

window.addEventListener("scroll",()=>{

if(window.scrollY>500){

topBtn?.classList.add("show");

}else{

topBtn?.classList.remove("show");

}

});

topBtn?.addEventListener("click",()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

});

/*======================================
        DARK MODE
======================================*/

const darkToggle=document.getElementById("darkMode");

if(localStorage.getItem("theme")=="dark"){

document.body.classList.add("dark");

}

darkToggle?.addEventListener("click",()=>{

document.body.classList.toggle("dark");

if(document.body.classList.contains("dark")){

localStorage.setItem("theme","dark");

}else{

localStorage.setItem("theme","light");

}

});

/*======================================
        TOAST
======================================*/

function toast(message){

const toast=document.createElement("div");

toast.className="toast";

toast.innerHTML=message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{

toast.remove();

},400);

},2500);

}

/*======================================
        CART
======================================*/

updateCart();

async function addCart(id){

const authToken=localStorage.getItem("token");

if(!authToken){
toast("Please log in to add items to your cart");
setTimeout(()=>{ window.location.href="login.html"; },1200);
return;
}

try{

const res=await fetch(`${API_URL}/users/cart`,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+authToken
},
body:JSON.stringify({ productId:id, quantity:1 })
});

if(!res.ok){
const data=await res.json();
toast(data.message || "Could not add to cart");
return;
}

toast("🛒 Added to Cart");
updateCart();

}catch(err){
toast("Could not reach the server");
console.error(err);
}

}

async function updateCart(){

const badges=document.querySelectorAll(".badge");
if(!badges.length) return;

const authToken=localStorage.getItem("token");
if(!authToken){
badges[1].innerText=0;
return;
}

try{
const res=await fetch(`${API_URL}/users/cart`,{
headers:{ "Authorization":"Bearer "+authToken }
});
const cart=await res.json();
if(!res.ok) return;
badges[1].innerText=cart.reduce((sum,item)=>sum+item.quantity,0);
}catch(err){
console.error(err);
}

}

/*======================================
        WISHLIST
======================================*/

async function addWishlist(id){

const authToken=localStorage.getItem("token");

if(!authToken){
toast("Please log in to use your wishlist");
setTimeout(()=>{ window.location.href="login.html"; },1200);
return;
}

try{

const res=await fetch(`${API_URL}/users/wishlist/${id}`,{
method:"POST",
headers:{ "Authorization":"Bearer "+authToken }
});

if(!res.ok){
const data=await res.json();
toast(data.message || "Could not add to wishlist");
return;
}

toast("❤️ Added to Wishlist");
updateWishlist();

}catch(err){
toast("Could not reach the server");
console.error(err);
}

}

async function updateWishlist(){

const badges=document.querySelectorAll(".badge");
if(!badges.length) return;

const authToken=localStorage.getItem("token");
if(!authToken){
badges[0].innerText=0;
return;
}

try{
const res=await fetch(`${API_URL}/users/wishlist`,{
headers:{ "Authorization":"Bearer "+authToken }
});
const wishlist=await res.json();
if(!res.ok) return;
badges[0].innerText=wishlist.length;
}catch(err){
console.error(err);
}

}

updateWishlist();

/*======================================
        QUICK VIEW
======================================*/

function quickView(id){

const product=products.find(p=>p.id===id);

if(!product) return;

document.getElementById("modalProduct").innerHTML=`
<img src="${product.image}" style="max-height:350px;object-fit:cover;" onerror="this.onerror=null;this.src=imgPlaceholder('${product.team}')">
<h2>${product.name}</h2>
<h3>${product.price} EGP</h3>
<p>★★★★★</p>
<p>Premium Football Jersey</p>
`;

document.getElementById("quickViewModal").style.display="flex";

}

document.getElementById("closeModal").onclick=()=>{

document.getElementById("quickViewModal").style.display="none";

}

/*======================================
        SCROLL REVEAL
======================================*/

const reveals=document.querySelectorAll(".fade-up");

window.addEventListener("scroll",()=>{

reveals.forEach(item=>{

const top=item.getBoundingClientRect().top;

if(top<window.innerHeight-100){

item.classList.add("show");

}

});

});

/*======================================
        HERO SLIDER
======================================*/

const hero=document.querySelector(".hero");

const slides=[

"assets/images/hero1.jpg",

"assets/images/hero2.jpg",

"assets/images/hero3.jpg",

"assets/images/hero4.jpg"

];

let current=0;

setInterval(()=>{

current++;

if(current>=slides.length){

current=0;

}

hero.style.backgroundImage=

`linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)),url(${slides[current]})`;

},5000);

/*======================================
        NEWSLETTER
======================================*/

const form=document.querySelector(".newsletter form");

form?.addEventListener("submit",(e)=>{

e.preventDefault();

toast("✅ Thanks for subscribing!");

form.reset();

});

/*======================================
        SMOOTH LINKS
======================================*/

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

anchor.addEventListener("click",function(e){

e.preventDefault();

const target=document.querySelector(this.getAttribute("href"));

target?.scrollIntoView({

behavior:"smooth"

});

});

});
