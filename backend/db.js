const mongoose = require("mongoose");
const {Schema , model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
    first_name : String,
    last_name : String,
    email : {type:String , required:true,unique:true},
    password:{type:String,required:true}
})

const userModel = model("User",UserSchema)
module.exports = {userModel};

