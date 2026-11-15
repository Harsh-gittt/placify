const express = require("express");
const jwt = require("jsonwebtoken");


require('dotenv').config(); 
const secretKey = process.env.SECRET_KEY;

function userauthmiddleware(req,res,next){
    try{
    const token = req.header("Authorization")
     const id = jwt.verify(token, secretKey).id
     req.id = id
     next();
     
}
    catch(e){
        res.status(401).send({error:"Please authenticate using a valid token " + e.message})
    }
}

module.exports = userauthmiddleware;