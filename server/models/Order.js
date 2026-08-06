const mongoose=require("mongoose");
const OrderSchema=new mongoose.Schema({
user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},
products:[],
total:Number,
status:{
type:String,
default:"Pending"
},
paymentMethod:String,
shippingAddress:String
},{timestamps:true});
module.exports=
mongoose.model("Order",OrderSchema);
