const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
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

// Change own password — requires the current password for verification
router.put("/password", auth, async (req,res)=>{
    try{
        const { currentPassword, newPassword } = req.body;
        if(!currentPassword || !newPassword){
            return res.status(400).json({ message:"Current and new password are required" });
        }
        if(newPassword.length < 6){
            return res.status(400).json({ message:"New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if(!match){
            return res.status(401).json({ message:"Current password is incorrect" });
        }

        user.password = newPassword; // re-hashed automatically by the pre-save hook
        await user.save();

        res.json({ message:"Password updated successfully" });
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

// Add a product to cart, or increase quantity if the same product+size is already there
router.post("/cart", auth, async (req,res)=>{
    try{
        const { productId, quantity, size } = req.body;
        const normalizedSize = size || null;
        const user = await User.findById(req.user.id);

        const existing = user.cart.find(item =>
            item.product.toString() === productId && (item.size || null) === normalizedSize
        );
        if(existing){
            existing.quantity += quantity || 1;
        }else{
            user.cart.push({ product:productId, quantity: quantity || 1, size: normalizedSize });
        }

        await user.save();
        await user.populate("cart.product");
        res.json(user.cart);
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

// Set exact quantity for one cart line (identified by its own line id, not the product id,
// since the same product can appear multiple times in different sizes)
router.put("/cart/:itemId", auth, async (req,res)=>{
    try{
        const { quantity } = req.body;
        const user = await User.findById(req.user.id);

        const item = user.cart.id(req.params.itemId);
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

// Remove one cart line by its own line id
router.delete("/cart/:itemId", auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        user.cart = user.cart.filter(item => item._id.toString() !== req.params.itemId);
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
