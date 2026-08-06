// Real gate: verifies the token against the server before showing
// anything. A tampered localStorage role can no longer get past this —
// the page stays hidden until the backend itself confirms (via a
// protected, admin-only request) that this token belongs to an admin.
const currentUser = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

function denyAccess(message){
    alert(message);
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

async function verifyAdminAccess(){
    if(!token || !currentUser){
        denyAccess("Admin access only. Please log in with an admin account.");
        return false;
    }

    try{
        // /api/users is an admin-only route — if this succeeds, the
        // server itself has confirmed the token's role is "admin".
        const res = await fetch(`${API_URL}/users`,{
            headers:{ "Authorization":"Bearer "+token }
        });

        if(res.status === 401){
            denyAccess("Your session has expired. Please log in again.");
            return false;
        }

        if(res.status === 403){
            denyAccess("Admin access only. Your account doesn't have permission.");
            return false;
        }

        if(!res.ok){
            alert("Could not verify admin access. Is the backend running?");
            return false;
        }

        document.getElementById("dashboardContent").style.display = "flex";
        return true;

    }catch(err){
        alert("Could not reach the server to verify admin access.");
        console.error(err);
        return false;
    }
}

const table=document.getElementById("tableBody");
let products=[];

function authHeaders(){
    return {
        "Content-Type":"application/json",
        "Authorization":"Bearer "+token
    };
}

async function loadProducts(){
    try{
        const res=await fetch(`${API_URL}/products?limit=100`);
        const data=await res.json();
        products = Array.isArray(data) ? data : data.products;
        renderProducts();
    }catch(err){
        table.innerHTML = `<tr><td colspan="5">Could not load products. Is the backend running?</td></tr>`;
        console.error(err);
    }
}

function renderProducts(){
table.innerHTML="";
products.forEach((product)=>{
const thumb = (product.images && product.images[0]) || "";
table.innerHTML+=`
<tr>
<td>${thumb ? `<img src="${thumb}" style="width:45px;height:45px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">` : "—"}</td>
<td>${product.name}</td>
<td>${product.price} EGP</td>
<td>${product.stock}</td>
<td>
<button class="edit"
onclick="editProduct('${product._id}')">
Edit
</button>
<button onclick="uploadImageFor('${product._id}')">
Upload Image
</button>
<button class="delete"
onclick="deleteProduct('${product._id}')">
Delete
</button>
</td>
</tr>
`;
});
document.getElementById("productsCount")
.innerHTML=products.length;
}

let uploadTargetId = null;
const imageFileInput = document.getElementById("imageFileInput");

function uploadImageFor(id){
    uploadTargetId = id;
    imageFileInput.click();
}

imageFileInput.addEventListener("change", async ()=>{
    const file = imageFileInput.files[0];
    if(!file || !uploadTargetId) return;

    const formData = new FormData();
    formData.append("image", file);

    try{
        const res = await fetch(`${API_URL}/products/upload`,{
            method:"POST",
            headers:{ "Authorization":"Bearer "+token },
            body: formData
        });

        const data = await res.json();

        if(!res.ok){
            alert(data.message || "Upload failed");
            return;
        }

        const putRes = await fetch(`${API_URL}/products/${uploadTargetId}`,{
            method:"PUT",
            headers: authHeaders(),
            body: JSON.stringify({ images:[data.url] })
        });

        if(!putRes.ok){
            const putData = await putRes.json();
            alert(putData.message || "Could not attach image to product");
            return;
        }

        await loadProducts();
        alert("Image uploaded!");

    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }finally{
        imageFileInput.value = "";
        uploadTargetId = null;
    }
});

async function deleteProduct(id){
    if(!confirm("Delete this product?")) return;
    try{
        const res=await fetch(`${API_URL}/products/${id}`,{
            method:"DELETE",
            headers:authHeaders()
        });
        if(!res.ok){
            const data=await res.json();
            alert(data.message || "Delete failed");
            return;
        }
        await loadProducts();
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
}

async function editProduct(id){
    const product = products.find(p=>p._id===id);
    if(!product) return;

    const name = prompt("Product Name", product.name);
    if(name === null) return;
    const price = prompt("Price", product.price);
    if(price === null) return;
    const stock = prompt("Stock", product.stock);
    if(stock === null) return;
    const category = prompt("Category", product.category || "");
    if(category === null) return;
    const description = prompt("Description", product.description || "");
    if(description === null) return;
    const currentImage = (product.images && product.images[0]) || "";
    const image = prompt("Image URL (paste a link to a photo)", currentImage);
    if(image === null) return;

    try{
        const res=await fetch(`${API_URL}/products/${id}`,{
            method:"PUT",
            headers:authHeaders(),
            body:JSON.stringify({
                name,
                price:Number(price),
                stock:Number(stock),
                category,
                description,
                images:image ? [image] : []
            })
        });
        if(!res.ok){
            const data=await res.json();
            alert(data.message || "Update failed");
            return;
        }
        await loadProducts();
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
}

document.getElementById("addProduct").onclick=async()=>{
    const name = prompt("Product name?");
    if(!name) return;
    const price = prompt("Price (EGP)?");
    if(price === null) return;
    const category = prompt("Category?", "Uncategorized");
    if(category === null) return;
    const description = prompt("Description? (optional)", "");
    if(description === null) return;
    const image = prompt("Image URL (paste a link to a photo, or leave blank)");
    if(image === null) return;

    try{
        const res=await fetch(`${API_URL}/products`,{
            method:"POST",
            headers:authHeaders(),
            body:JSON.stringify({
                name,
                price:Number(price)||0,
                stock:0,
                category,
                description,
                images:image ? [image] : []
            })
        });
        if(!res.ok){
            const data=await res.json();
            alert(data.message || "Create failed");
            return;
        }
        await loadProducts();
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
};

/*======================================
        ORDERS
======================================*/

const ordersTable = document.getElementById("ordersTableBody");
let orders = [];

async function loadOrders(){
    try{
        const res = await fetch(`${API_URL}/orders`,{
            headers: authHeaders()
        });
        const data = await res.json();

        if(!res.ok){
            ordersTable.innerHTML = `<tr><td colspan="6">${data.message || "Could not load orders"}</td></tr>`;
            return;
        }

        orders = data;
        renderOrders();
        updateDashboardStats();
    }catch(err){
        ordersTable.innerHTML = `<tr><td colspan="6">Could not reach the server.</td></tr>`;
        console.error(err);
    }
}

function renderOrders(){
    if(orders.length === 0){
        ordersTable.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`;
        return;
    }

    ordersTable.innerHTML = orders.map(order => `
        <tr>
            <td>${order._id.slice(-6)}</td>
            <td>${order.user ? order.user.name : "Unknown"}</td>
            <td>${order.total} EGP</td>
            <td>${order.paymentMethod || "—"}</td>
            <td>
                <select onchange="updateOrderStatus('${order._id}', this.value)">
                    <option value="Pending" ${order.status==="Pending"?"selected":""}>Pending</option>
                    <option value="Paid" ${order.status==="Paid"?"selected":""}>Paid</option>
                    <option value="Payment Failed" ${order.status==="Payment Failed"?"selected":""}>Payment Failed</option>
                    <option value="Shipped" ${order.status==="Shipped"?"selected":""}>Shipped</option>
                    <option value="Delivered" ${order.status==="Delivered"?"selected":""}>Delivered</option>
                    <option value="Cancelled" ${order.status==="Cancelled"?"selected":""}>Cancelled</option>
                </select>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join("");
}

async function updateOrderStatus(id, status){
    try{
        const res = await fetch(`${API_URL}/orders/${id}/status`,{
            method:"PUT",
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        if(!res.ok){
            const data = await res.json();
            alert(data.message || "Could not update order status");
            return;
        }
        await loadOrders();
    }catch(err){
        alert("Could not reach the server.");
        console.error(err);
    }
}

function updateDashboardStats(){
    document.getElementById("ordersCount").innerHTML = orders.length;

    const uniqueCustomers = new Set(orders.map(o => o.user && o.user._id).filter(Boolean));
    document.getElementById("customersCount").innerHTML = uniqueCustomers.size;

    const revenue = orders
        .filter(o => o.status !== "Cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById("revenueCount").innerHTML = revenue + " EGP";
}

/*======================================
        CUSTOMERS
======================================*/

const customersTable = document.getElementById("customersTableBody");

async function loadCustomers(){
    try{
        const res = await fetch(`${API_URL}/users`,{
            headers: authHeaders()
        });
        const users = await res.json();

        if(!res.ok){
            customersTable.innerHTML = `<tr><td colspan="4">${users.message || "Could not load customers"}</td></tr>`;
            return;
        }

        if(users.length === 0){
            customersTable.innerHTML = `<tr><td colspan="4">No customers yet.</td></tr>`;
            document.getElementById("customersCount").innerHTML = 0;
            return;
        }

        document.getElementById("customersCount").innerHTML = users.length;

        customersTable.innerHTML = users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone || "—"}</td>
                <td>${u.role}</td>
            </tr>
        `).join("");

    }catch(err){
        customersTable.innerHTML = `<tr><td colspan="4">Could not reach the server.</td></tr>`;
        console.error(err);
    }
}

verifyAdminAccess().then(ok=>{
    if(ok){
        loadProducts();
        loadOrders();
        loadCustomers();
    }
});
