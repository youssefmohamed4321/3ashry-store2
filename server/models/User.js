const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const UserSchema=new mongoose.Schema({
name:String,
email:{
type:String,
unique:true,
lowercase:true,
trim:true
},
password:String,
role:{
type:String,
default:"customer"
},
address:String,
phone:String,
cart:[
{
product:{ type:mongoose.Schema.Types.ObjectId, ref:"Product" },
quantity:{ type:Number, default:1 },
size:{ type:String, default:null }
}
],
wishlist:[
{ type:mongoose.Schema.Types.ObjectId, ref:"Product" }
]
});
UserSchema.pre("save",async function(){
if(!this.isModified("password")) return;
this.password=
await bcrypt.hash(this.password,10);
});
module.exports=
mongoose.model("User",UserSchema);
