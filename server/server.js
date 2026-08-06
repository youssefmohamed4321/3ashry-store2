const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "3ashry-store API is running" });
});

// Slow down brute-force attempts against login/register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." }
});

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/users"));
app.use("/api/payment", require("./routes/payment"));

// Catch anything that isn't a known route
app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
});
