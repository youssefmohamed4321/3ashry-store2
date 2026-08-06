const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const createToken = require("../utils/createToken");

router.post("/register", async (req,res)=>{
    try{
        let { name, email, password, phone, address } = req.body;

        if(!name || !email || !password){
            return res.status(400).json({ message:"Name, email, and password are required" });
        }

        email = email.trim().toLowerCase();

        const existing = await User.findOne({ email });
        if(existing){
            return res.status(409).json({ message:"An account with this email already exists" });
        }

        const user = await User.create({ name, email, password, phone, address });
        const token = createToken(user);

        res.status(201).json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        });
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

router.post("/login", async (req,res)=>{
    try{
        let { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({ message:"Email and password are required" });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if(!user){
            return res.status(401).json({ message:"Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);
        if(!match){
            return res.status(401).json({ message:"Invalid email or password" });
        }

        const token = createToken(user);

        res.json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        });
    }catch(err){
        res.status(500).json({ message:err.message });
    }
});

module.exports = router;
