const express = require("express");
const router = express.Router();
const fs = require("fs");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const upload = multer({
    dest: "uploads/"
});

router.get("/",async(req,res)=>{
try{
const page=Number(req.query.page)||1;
const limit=12;
const skip=(page-1)*limit;
const filter={};
if(req.query.category){
filter.category=req.query.category;
}
if(req.query.team){
filter.team=req.query.team;
}
const [products,total]=await Promise.all([
Product.find(filter)
.sort({
price:1
})
.skip(skip)
.limit(limit),
Product.countDocuments(filter)
]);
res.json({
products,
totalPages:Math.ceil(total/limit),
currentPage:page
});
}catch(err){
res.status(500).json({ message:err.message });
}
});

router.get("/search",async(req,res)=>{
try{
const q=req.query.q;
const products=
await Product.find({
name:{
$regex:q,
$options:"i"
}
});
res.json(products);
}catch(err){
res.status(500).json({ message:err.message });
}
});

router.get("/:id",async(req,res)=>{
try{
const product=await Product.findById(req.params.id);
if(!product){
return res.status(404).json({ message:"Product not found" });
}
res.json(product);
}catch(err){
res.status(500).json({ message:err.message });
}
});

router.post("/",auth,admin,async(req,res)=>{
try{
const product=
await Product.create(req.body);
res.status(201).json(product);
}catch(err){
res.status(400).json({ message:err.message });
}
});

router.put("/:id",auth,admin,async(req,res)=>{
try{
const product=
await Product.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
);
if(!product){
return res.status(404).json({ message:"Product not found" });
}
res.json(product);
}catch(err){
res.status(400).json({ message:err.message });
}
});

router.delete("/:id",auth,admin,async(req,res)=>{
try{
const product=await Product.findByIdAndDelete(req.params.id);
if(!product){
return res.status(404).json({ message:"Product not found" });
}
res.json({
message:"Deleted"
});
}catch(err){
res.status(500).json({ message:err.message });
}
});

router.post(
    "/upload",
    auth,
    admin,
    upload.single("image"),
    async (req,res)=>{
        try{
            if(!req.file){
                return res.status(400).json({ message:"No image file provided" });
            }

            // No "folder" option here on purpose: some Cloudinary accounts
            // (Dynamic Folder Mode) reject API uploads into a folder that
            // doesn't already exist yet. Uploading to the root avoids that
            // entirely. Assets can still be organized into folders later
            // from the Cloudinary Media Library UI.
            const result = await cloudinary.uploader.upload(req.file.path);

            fs.unlink(req.file.path, ()=>{});

            res.json({ url: result.secure_url });
        }catch(err){
            console.error("Cloudinary upload error:", err.message || err);
            res.status(500).json({ message: err.message || "Image upload failed" });
        }
    }
);

router.post("/:id/reviews", auth, async(req,res)=>{
try{
const { user, comment, rating } = req.body;

if(!comment || !rating){
return res.status(400).json({ message:"Comment and rating are required" });
}

const product = await Product.findById(req.params.id);
if(!product){
return res.status(404).json({ message:"Product not found" });
}

product.reviews.push({
user: user || "Anonymous",
comment,
rating: Number(rating)
});

// Keep the product's overall rating as the average of all reviews
const total = product.reviews.reduce((sum,r)=>sum + r.rating, 0);
product.rating = Math.round(total / product.reviews.length);

await product.save();

res.status(201).json(product);
}catch(err){
res.status(500).json({ message:err.message });
}
});

module.exports = router;
