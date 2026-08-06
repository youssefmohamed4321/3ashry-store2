// One-time setup script.
// Run with: node seed.js
// Creates an admin account and inserts the product catalog.

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");

const products = [
  {
    name: "Classic Crew Neck T-Shirt",
    team: "Urban Basics",
    price: 450,
    oldPrice: 650,
    rating: 5,
    category: "T-Shirts",
    sizes: ["S", "M", "L", "XL"],
    images: ["assets/images/tshirt-crew.jpg"],
    badge: "NEW",
    stock: 20
  },
  {
    name: "Oxford Button-Down Shirt",
    team: "Northline",
    price: 850,
    oldPrice: 1100,
    rating: 5,
    category: "Shirts",
    sizes: ["S", "M", "L", "XL"],
    images: ["assets/images/shirt-oxford.jpg"],
    badge: "HOT",
    stock: 15
  },
  {
    name: "Slim Fit Chino Pants",
    team: "Heritage Co.",
    price: 950,
    oldPrice: 1300,
    rating: 4,
    category: "Pants",
    sizes: ["30", "32", "34", "36"],
    images: ["assets/images/chino-pants.jpg"],
    badge: "SALE",
    stock: 18
  },
  {
    name: "Pullover Hoodie",
    team: "Urban Basics",
    price: 1100,
    oldPrice: 1450,
    rating: 5,
    category: "Jackets & Hoodies",
    sizes: ["S", "M", "L", "XL"],
    images: ["assets/images/hoodie-pullover.jpg"],
    badge: "NEW",
    stock: 12
  },
  {
    name: "Bomber Jacket",
    team: "Northline",
    price: 1800,
    oldPrice: 2400,
    rating: 5,
    category: "Jackets & Hoodies",
    sizes: ["S", "M", "L", "XL"],
    images: ["assets/images/jacket-bomber.jpg"],
    badge: "HOT",
    stock: 10
  },
  {
    name: "Denim Jeans - Straight Fit",
    team: "Heritage Co.",
    price: 1050,
    oldPrice: 1400,
    rating: 4,
    category: "Pants",
    sizes: ["30", "32", "34", "36"],
    images: ["assets/images/jeans-straight.jpg"],
    badge: "SALE",
    stock: 20
  },
  {
    name: "Canvas Low-Top Sneakers",
    team: "Urban Basics",
    price: 900,
    oldPrice: 1200,
    rating: 5,
    category: "Casual Shoes",
    sizes: ["40", "41", "42", "43", "44"],
    images: ["assets/images/sneakers-canvas.jpg"],
    badge: "NEW",
    stock: 14
  },
  {
    name: "Suede Desert Boots",
    team: "Heritage Co.",
    price: 1350,
    oldPrice: 1750,
    rating: 5,
    category: "Casual Shoes",
    sizes: ["40", "41", "42", "43", "44"],
    images: ["assets/images/boots-desert.jpg"],
    badge: "HOT",
    stock: 8
  }
];

const ADMIN_EMAIL = "admin@3ashry.com";
const ADMIN_PASSWORD = "Admin123!";

async function seed(){
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Products: wipe and re-insert, so re-running this is safe/repeatable
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✅ Inserted ${products.length} products`);

    // Admin user: only create if it doesn't already exist
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if(existingAdmin){
      console.log(`ℹ️  Admin account already exists (${ADMIN_EMAIL}) — left as-is`);
    }else{
      await User.create({
        name: "Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin"
      });
      console.log("✅ Admin account created");
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    console.log("\n🎉 Done. You can now log in with the admin account above.");
  }catch(err){
    console.error("❌ Seed failed:", err.message);
  }finally{
    await mongoose.disconnect();
  }
}

seed();
