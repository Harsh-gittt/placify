const express = require("express");
const app = express();
const cors = require("cors")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

require("dotenv").config();

const {userModel} = require("./db.js");

const PORT = process.env.PORT;
const mongodb_url = process.env.mongodb_url;
const jwt_secret_key = process.env.secret_key;


app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));



app.post("/signup" , async (req,res) => {
    try{
    const{first_name, last_name , email , password} = req.body;
    const newUser = await new userModel({
        first_name,
        last_name,
        email,
        password,
    })
    newUser.save();
    res.send("user created successfully.")
  }catch(err){
    res.send(err , "error while creating user");
}
})

app.post("/signin" , async (req,res) => {
    try{
        const{email,password} = req.body;

        const user = await userModel.findOne({
            email,
            password
        });

        const jwt_token = jwt.sign({
            id : user._id
        },jwt_secret_key);

        res.status(200).json({auth_token : jwt_token});

     }catch(err){
        res.status(401).send(err);
    }
})

const userauthmiddleware = require('./middlewares/user.js');

app.use(userauthmiddleware);

app.get('/get-user-details' , async  (req,res) => {
    const id = req.id;
    const user = await userModel.findById(id);
    res.status(200).json({ user });
})

async function main() {
  await mongoose.connect(mongodb_url).then(() => {
    console.log("✅ Connected to MongoDB");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
main();
