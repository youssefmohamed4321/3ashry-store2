/*======================================
        LOAD PRODUCT (dynamic by ?id=)
======================================*/

let product = null;
let allProducts = [];

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

function imgPlaceholder(label){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><rect width='100%' height='100%' fill='#0B3D2E'/><text x='50%' y='50%' fill='white' font-size='24' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeProduct(p){
    return {
        id: p._id,
        name: p.name,
        team: p.team || "Englishino",
        price: p.price,
        oldPrice: p.oldPrice,
        rating: p.rating,
        category: p.category,
        description: p.description || "",
        image: (p.images && p.images[0]) || "",
        badge: p.badge || "",
        reviews: p.reviews || []
    };
}

Promise.all([
    productId
        ? fetch(`${API_URL}/products/${productId}`).then(res => res.ok ? res.json() : null)
        : Promise.resolve(null),
    fetch(`${API_URL}/products?limit=50`).then(res => res.json())
]).then(([single, listData])=>{
    allProducts = (Array.isArray(listData) ? listData : listData.products).map(normalizeProduct);
    product = single ? normalizeProduct(single) : allProducts[0];
    renderProduct();
    renderRelated();
    renderReviews();
    trackRecentlyViewed();
    renderRecentlyViewed();
}).catch(err=>{
    console.error("Could not load product from the backend:", err);
    document.getElementById("productName").innerHTML = "Could not load this product";
});

function renderProduct(){
    if(!product) return;

    document.getElementById("productName").innerHTML = product.name;
    document.title = product.name + " | 3ASHRY STORE";
    document.getElementById("reviewCount").innerHTML = `(${(product.rating||5) * 25} Reviews)`;
    document.getElementById("oldPrice").innerHTML = product.oldPrice + " EGP";
    document.getElementById("newPrice").innerHTML = product.price + " EGP";
    document.getElementById("productDescription").innerHTML =
        product.description ||
        `${product.name} by ${product.team}. Premium fabric, comfortable everyday fit. Part of the 2026 collection.`;

    const mainImage = document.getElementById("mainImage");
    mainImage.src = product.image;
    mainImage.onerror = function(){
        this.onerror = null;
        this.src = imgPlaceholder(product.team);
    };

    const thumbnails = document.getElementById("thumbnails");
    thumbnails.innerHTML = `<img src="${product.image}" onerror="this.onerror=null;this.src=imgPlaceholder('${product.team}')">`;
}

function renderRelated(){
    const relatedGrid = document.querySelector(".related .products-grid");
    if(!relatedGrid || !product) return;

    const related = allProducts.filter(p => p.id !== product.id).slice(0, 4);

    if(related.length === 0){
        relatedGrid.innerHTML = "<p class='no-results'>No related products yet.</p>";
        return;
    }

    relatedGrid.innerHTML = related.map(p => `
        <div class="product-card">
            <span class="sale">${p.badge}</span>
            <img src="${p.image}" onerror="this.onerror=null;this.src=imgPlaceholder('${p.team}')">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.team}</p>
                <div class="price">
                    <span class="old">${p.oldPrice} EGP</span>
                    <span class="new">${p.price} EGP</span>
                </div>
                <div class="product-buttons">
                    <button onclick="window.location.href='product.html?id=${p.id}'">
                        View Product
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function trackRecentlyViewed(){
    let recent = JSON.parse(localStorage.getItem("recent")) || [];
    recent = recent.filter(id => id !== product.id);
    recent.unshift(product.id);
    recent = recent.slice(0, 8);
    localStorage.setItem("recent", JSON.stringify(recent));
}

function renderReviews(){
    const reviewsList = document.getElementById("reviewsList");
    if(!reviewsList || !product) return;

    if(!product.reviews || product.reviews.length === 0){
        reviewsList.innerHTML = "<div class='review-box'>No reviews yet. Be the first!</div>";
        return;
    }

    reviewsList.innerHTML = product.reviews.map(r => `
        <div class="review-box">
            ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}<br>
            ${r.comment}<br>
            <strong>— ${r.user || "Anonymous"}</strong>
        </div>
    `).join("");
}

document.getElementById("reviewForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const token = localStorage.getItem("token");
    if(!token){
        alert("Please log in to write a review");
        window.location.href = "login.html";
        return;
    }

    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};

    try{
        const res = await fetch(`${API_URL}/products/${product.id}/reviews`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+token
            },
            body: JSON.stringify({
                user: currentUser.name || "Anonymous",
                comment,
                rating
            })
        });

        const data = await res.json();

        if(!res.ok){
            alert(data.message || "Could not submit review");
            return;
        }

        product.reviews = data.reviews;
        product.rating = data.rating;
        renderReviews();
        document.getElementById("reviewForm").reset();
        alert("Thanks for your review!");

    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
});

function renderRecentlyViewed(){
    const section = document.getElementById("recentlyViewedSection");
    const grid = document.getElementById("recentlyViewedGrid");
    if(!section || !grid) return;

    const recentIds = (JSON.parse(localStorage.getItem("recent")) || [])
        .filter(id => id !== product.id);

    const recentProducts = recentIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 4);

    if(recentProducts.length === 0){
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    grid.innerHTML = recentProducts.map(p => `
        <div class="product-card">
            <span class="sale">${p.badge}</span>
            <img src="${p.image}" onerror="this.onerror=null;this.src=imgPlaceholder('${p.team}')">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.team}</p>
                <div class="price">
                    <span class="old">${p.oldPrice} EGP</span>
                    <span class="new">${p.price} EGP</span>
                </div>
                <div class="product-buttons">
                    <button onclick="window.location.href='product.html?id=${p.id}'">
                        View Product
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

/*======================================
        ADD TO CART / WISHLIST
======================================*/

async function addToCartFromProductPage(){
    if(!product) return;

    const token = localStorage.getItem("token");
    if(!token){
        alert("Please log in to add items to your cart");
        window.location.href = "login.html";
        return;
    }

    try{
        await fetch(`${API_URL}/users/cart`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+token
            },
            body: JSON.stringify({ productId: product.id, quantity: qty })
        });
        updateFloatingCart();
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
}

async function addWishlistFromProductPage(){
    if(!product) return;

    const token = localStorage.getItem("token");
    if(!token){
        alert("Please log in to use your wishlist");
        window.location.href = "login.html";
        return;
    }

    try{
        await fetch(`${API_URL}/users/wishlist/${product.id}`,{
            method:"POST",
            headers:{ "Authorization":"Bearer "+token }
        });
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
}

async function updateFloatingCart(){
    const el = document.getElementById("cartCount");
    if(!el) return;

    const token = localStorage.getItem("token");
    if(!token){
        el.innerHTML = 0;
        return;
    }

    try{
        const res = await fetch(`${API_URL}/users/cart`,{
            headers:{ "Authorization":"Bearer "+token }
        });
        const cart = await res.json();
        if(!res.ok) return;
        el.innerHTML = cart.reduce((sum,item)=>sum+item.quantity, 0);
    }catch(err){
        console.error(err);
    }
}
updateFloatingCart();

document.querySelector(".floating-cart")?.addEventListener("click", ()=>{
    window.location.href = "cart.html";
});

/*======================================
        GALLERY THUMBNAILS
======================================*/

const main=document.getElementById("mainImage");
document.getElementById("thumbnails").addEventListener("click",(e)=>{
if(e.target.tagName==="IMG"){
main.src=e.target.src;
}
});

/*======================================
        QUANTITY
======================================*/

let qty=1;
plus.onclick=()=>{
qty++;
document.getElementById("qty").innerHTML=qty;
}
minus.onclick=()=>{
if(qty>1){
qty--;
document.getElementById("qty").innerHTML=qty;
}
}

/*======================================
        ZOOM
======================================*/

const image=document.getElementById("mainImage");
image.addEventListener("mousemove",(e)=>{
const x=e.offsetX/image.offsetWidth*100;
const y=e.offsetY/image.offsetHeight*100;
image.style.transformOrigin=x+"% "+y+"%";
image.style.transform="scale(2)";
});
image.addEventListener("mouseleave",()=>{
image.style.transform="scale(1)";
});

/*======================================
        DELIVERY ESTIMATE
======================================*/

const date=new Date();
date.setDate(date.getDate()+5);
document.getElementById("deliveryDate").innerHTML=
date.toDateString();

/*======================================
        COUPON
======================================*/

function applyCoupon(){
const code=document.getElementById("coupon").value;
if(code=="SALE50"){
alert("50% Discount Applied!");
}else{
alert("Invalid Coupon");
}
}

/*======================================
        TABS
======================================*/

const tabs=document.querySelectorAll(".tab");
const contents=document.querySelectorAll(".content");
tabs.forEach((tab,index)=>{
tab.onclick=()=>{
tabs.forEach(t=>t.classList.remove("active"));
contents.forEach(c=>c.classList.remove("active"));
tab.classList.add("active");
contents[index].classList.add("active");
}
});
