const ordersList = document.getElementById("ordersList");
const token = localStorage.getItem("token");

if(!token){
    ordersList.innerHTML = "<h2>Please log in to view your orders.</h2><a href='login.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Log In</a>";
}else{
    loadMyOrders();
}

async function loadMyOrders(){
    try{
        const res = await fetch(`${API_URL}/orders/mine`,{
            headers:{ "Authorization":"Bearer "+token }
        });
        const orders = await res.json();

        if(!res.ok){
            ordersList.innerHTML = `<h2>${orders.message || "Could not load your orders"}</h2>`;
            return;
        }

        if(orders.length === 0){
            ordersList.innerHTML = "<h2>You haven't placed any orders yet.</h2><a href='index.html' class='btn btn-primary' style='margin-top:20px;display:inline-block;'>Start Shopping</a>";
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="cart-item" style="flex-direction:column;align-items:flex-start;">
                <div style="display:flex;justify-content:space-between;width:100%;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h3>Order #${order._id.slice(-6)}</h3>
                        <p>${new Date(order.createdAt).toLocaleDateString()} · ${order.paymentMethod || "—"}</p>
                    </div>
                    <div style="text-align:right;">
                        <div class="cart-price">${order.total} EGP</div>
                        <span class="kit-tag" style="background:rgba(11,61,46,.1);color:var(--primary);">${order.status}</span>
                    </div>
                </div>
                <div style="margin-top:15px;width:100%;">
                    ${(order.products || []).map(p => `
                        <div class="checkout-item">
                            <span>${p.name} x${p.quantity}</span>
                            <span>${p.price * p.quantity} EGP</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `).join("");

    }catch(err){
        ordersList.innerHTML = "<h2>Could not reach the server. Is the backend running?</h2>";
        console.error(err);
    }
}
