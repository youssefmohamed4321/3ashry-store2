const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const User = require("../models/User");

const PAYMOB_BASE = "https://accept.paymob.com/api";

// Step 1: authenticate with Paymob and get a short-lived auth token
async function getAuthToken(){
    const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY })
    });
    const data = await res.json();
    if(!data.token) throw new Error("Could not authenticate with Paymob");
    return data.token;
}

// Step 2: register an "order" with Paymob
async function registerOrder(authToken, amountCents, merchantOrderId){
    const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: "EGP",
            merchant_order_id: merchantOrderId,
            items: []
        })
    });
    const data = await res.json();
    if(!data.id) throw new Error("Could not register order with Paymob");
    return data.id;
}

// Step 3: get a payment key for that order, tied to the billing data
async function getPaymentKey(authToken, amountCents, orderId, billingData){
    const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: "EGP",
            integration_id: process.env.PAYMOB_INTEGRATION_ID
        })
    });
    const data = await res.json();
    if(!data.token) throw new Error("Could not get Paymob payment key");
    return data.token;
}

// Called by the frontend right after an order is created, when the
// customer chose "Credit Card" instead of "Cash On Delivery".
router.post("/initiate", auth, async (req,res)=>{
    try{
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if(!order){
            return res.status(404).json({ message:"Order not found" });
        }

        const user = await User.findById(req.user.id);
        const amountCents = Math.round(order.total * 100);

        const authToken = await getAuthToken();
        const paymobOrderId = await registerOrder(authToken, amountCents, order._id.toString());

        const billingData = {
            first_name: (user.name || "Customer").split(" ")[0] || "Customer",
            last_name: (user.name || "Customer").split(" ")[1] || "Customer",
            email: user.email || "customer@example.com",
            phone_number: user.phone || "+201000000000",
            city: "Cairo",
            country: "EG",
            street: order.shippingAddress || "N/A",
            building: "N/A",
            floor: "N/A",
            apartment: "N/A"
        };

        const paymentKey = await getPaymentKey(authToken, amountCents, paymobOrderId, billingData);

        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

        res.json({ iframeUrl });

    }catch(err){
        res.status(500).json({ message: err.message });
    }
});

// Paymob signs every callback with an HMAC over a fixed set of fields so
// the receiver can prove the request really came from Paymob and wasn't
// forged by a third party trying to mark their own order as "Paid" for
// free. The field order below is fixed by Paymob's spec — do not reorder.
// See: https://docs.paymob.com/docs/transaction-callbacks (HMAC calculation)
function isValidPaymobHmac(obj, hmacFromQuery){
    if(!process.env.PAYMOB_HMAC_SECRET){
        // Not configured yet — caller decides how to handle this.
        return null;
    }
    if(!hmacFromQuery) return false;

    const fields = [
        "amount_cents", "created_at", "currency", "error_occured",
        "has_parent_transaction", "id", "integration_id", "is_3d_secure",
        "is_auction", "is_capture", "is_refunded", "is_standalone_payment",
        "is_voided", "order.id", "owner", "pending",
        "source_data.pan", "source_data.sub_type", "source_data.type",
        "success"
    ];

    const getField = (path)=> path.split(".").reduce((o,k)=> (o == null ? o : o[k]), obj);

    const concatenated = fields
        .map(f => {
            const val = getField(f);
            return val === undefined || val === null ? "" : String(val);
        })
        .join("");

    const computed = crypto
        .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
        .update(concatenated)
        .digest("hex");

    return computed === hmacFromQuery;
}

// Paymob calls this automatically after the customer pays (or fails to).
// This is what actually marks the order as paid — never trust the
// frontend redirect alone for that, since it can be spoofed.
router.post("/callback", express.json(), async (req,res)=>{
    try{
        const { obj } = req.body;
        if(!obj) return res.sendStatus(400);

        const hmacFromQuery = req.query.hmac;
        const verified = isValidPaymobHmac(obj, hmacFromQuery);

        if(verified === false){
            console.warn("Paymob callback rejected: invalid HMAC signature");
            return res.sendStatus(401);
        }
        if(verified === null){
            console.warn("PAYMOB_HMAC_SECRET is not set — accepting callback unverified. Set it before going live with real payments.");
        }

        const merchantOrderId = obj.order?.merchant_order_id;
        const success = obj.success;

        if(merchantOrderId){
            await Order.findByIdAndUpdate(merchantOrderId, {
                status: success ? "Paid" : "Payment Failed"
            });
        }

        res.sendStatus(200);
    }catch(err){
        console.error("Paymob callback error:", err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
