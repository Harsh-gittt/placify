const express = require("express");
const jwt = require("jsonwebtoken");


require('dotenv').config(); 
const secret_key = process.env.secret_key;

function userauthmiddleware(req,res,next){
    try{
    const token = req.header("Authorization")
     const id = jwt.verify(token,secret_key).id
     req.id = id
     next();
     
}
    catch(e){
        res.status(401).send({error:"Please authenticate using a valid token " + e.message})
    }
}

module.exports = userauthmiddleware;