const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Get own profile
router.get("/me", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({ message:"User not found" });
        }
        res.json(user);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Update own profile
router.put("/me", auth, async (req,res)=>{
    try{
        const { name, phone, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, address },
            { new:true }
        ).select("-password");
        res.json(user);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Admin: list all users
router.get("/", auth, admin, async (req,res)=>{
    try{
        const users = await User.find().select("-password");
        res.json(users);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

/*======================================
        CART
======================================*/

// Get own cart (with product details populated)
router.get("/cart", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id).populate("cart.product");
        res.json(user.cart);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Add a product to cart, or increase quantity if it's already there
router.post("/cart", auth, async (req,res)=>{
    try{
        const { productId, quantity } = req.body;
        const user = await User.findById(req.user.id);

        const existing = user.cart.find(item => item.product.toString() === productId);
        if(existing){
            existing.quantity += quantity || 1;
        }else{
            user.cart.push({ product:productId, quantity: quantity || 1 });
        }

        await user.save();
        await user.populate("cart.product");
        res.json(user.cart);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Set exact quantity for a cart item
router.put("/cart/:productId", auth, async (req,res)=>{
    try{
        const { quantity } = req.body;
        const user = await User.findById(req.user.id);

        const item = user.cart.find(item => item.product.toString() === req.params.productId);
        if(!item){
            return res.status(404).json({ message:"Item not in cart" });
        }

        item.quantity = Math.max(1, quantity);
        await user.save();
        await user.populate("cart.product");
        res.json(user.cart);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Remove one item from cart
router.delete("/cart/:productId", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
        await user.save();
        await user.populate("cart.product");
        res.json(user.cart);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Clear the whole cart (used after checkout)
router.delete("/cart", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        user.cart = [];
        await user.save();
        res.json([]);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

/*======================================
        WISHLIST
======================================*/

router.get("/wishlist", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id).populate("wishlist");
        res.json(user.wishlist);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

router.post("/wishlist/:productId", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id);

        const alreadyIn = user.wishlist.some(id => id.toString() === req.params.productId);
        if(!alreadyIn){
            user.wishlist.push(req.params.productId);
            await user.save();
        }

        await user.populate("wishlist");
        res.json(user.wishlist);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

router.delete("/wishlist/:productId", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
        await user.save();
        await user.populate("wishlist");
        res.json(user.wishlist);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

module.exports = router;
