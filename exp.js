const express=require("express");
var path = require('path');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const alert = require("alert");

const app=express();
app.use(express.json())
app.use(express.urlencoded())
//app.use(cors())

app.use(express.static(path.join(__dirname, 'assets')));

app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/serenery", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const User = new mongoose.model("User", userSchema)

app.get("/",function(req,res){
        res.sendFile(__dirname+"/login.html");   
}); 

app.get("/signup",function(req,res){
    res.sendFile(__dirname+"/signup.html");
});

app.get("/home",function(req,res){
    res.sendFile(__dirname+"/index.html");
});

app.get("/meditation",function(req,res){
    res.sendFile(__dirname+"/meditation.html");
});

app.get("/destress",function(req,res){
    res.sendFile(__dirname+"/navya.html");
});

app.get("/focus",function(req,res){
    res.sendFile(__dirname+"/focus.html");
});

app.get("/test",function(req,res){
    res.sendFile(__dirname+"/quiz.html");
});

app.get("/result",function(req,res){
    res.sendFile(__dirname+"/redirected.html");
});

app.get("/appointment",function(req,res){
    res.sendFile(__dirname+"/appointment.html");
});

app.post("/", (req, res)=> {
    const { email, password} = req.body
    User.findOne({ email: email}, (err, user) => {
        if(user){
            if(password === user.password ) {
                res.sendFile(__dirname+"/index.html"); 
            } else {
                alert("Password incorrect");
            }
        } else {
            alert("User not registered");
        }
    })
}) 

app.post("/signup", (req, res)=> {
    const { name, email, password} = req.body
    User.findOne({email: email}, (err, user) => {
        if(user){
            alert("User already registered");
        } else {
            const user = new User({
                name,
                email,
                password
            })
            user.save(err => {
                if(err) {
                    res.send(err)
                } else {
                    alert("Successfully Registered, Please login now.");
                }
            })
        }
        res.redirect("/");
    })
    
}) 

app.listen(3000,() => {
    console.log("port 3000");
})