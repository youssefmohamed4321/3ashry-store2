const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Create an order (any logged-in user)
// SECURITY: never trust product prices or the total sent by the client —
// always look them up from the database, or a malicious request could
// place an order for whatever price it wants.
router.post("/", auth, async (req,res)=>{
    const session = await mongoose.startSession();
    try{
        const { products, paymentMethod, shippingAddress } = req.body;

        if(!products || !products.length){
            return res.status(400).json({ message:"Order must include at least one product" });
        }

        let order;

        await session.withTransaction(async ()=>{
            let total = 0;
            const verifiedProducts = [];

            for(const item of products){
                const dbProduct = await Product.findById(item.product).session(session);
                if(!dbProduct){
                    throw new Error(`Product not found: ${item.product}`);
                }

                const quantity = Math.max(1, Number(item.quantity) || 1);

                if(dbProduct.stock < quantity){
                    throw new Error(`Not enough stock for "${dbProduct.name}" (only ${dbProduct.stock} left)`);
                }

                dbProduct.stock -= quantity;
                await dbProduct.save({ session });

                total += dbProduct.price * quantity;
                verifiedProducts.push({
                    product: dbProduct._id,
                    name: dbProduct.name,
                    quantity,
                    price: dbProduct.price
                });
            }

            const created = await Order.create([{
                user: req.user.id,
                products: verifiedProducts,
                total,
                paymentMethod,
                shippingAddress
            }], { session });

            order = created[0];
        });

        res.status(201).json(order);
    }catch(err){
        res.status(400).json({ message: err.message });
    }finally{
        session.endSession();
    }
});

// Get the logged-in user's own orders
router.get("/mine", auth, async (req,res)=>{
    try{
        const orders = await Order.find({ user:req.user.id }).sort({ createdAt:-1 });
        res.json(orders);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Admin: get all orders
router.get("/", auth, admin, async (req,res)=>{
    try{
        const orders = await Order.find()
            .populate("user","name email")
            .sort({ createdAt:-1 });
        res.json(orders);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Admin: update order status
router.put("/:id/status", auth, admin, async (req,res)=>{
    try{
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new:true }
        );

        if(!order){
            return res.status(404).json({ message:"Order not found" });
        }

        res.json(order);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

module.exports = router;
