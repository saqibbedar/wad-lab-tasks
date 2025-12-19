import bodyParser from "body-parser";
import express from "express";
import mongoose, { model } from "mongoose";
import path from "path";
// import fs from "fs";
import { configDotenv } from "dotenv";

// config
configDotenv();

// db connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if(uri) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("connected to database");
        }
    }   
    catch (e) {
        console.error(e);
    }
}
connectDB()

// instance
const app = express();

// middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// views
app.use(express.static(path.join(process.cwd(), "/views")));
app.use(express.static(path.join(process.cwd(), "/public")));


// test route
app.get("/", (req, res)=>{
    res.send("Everything is okay");
});

app.listen((process.env.PORT || 8000), ()=>{
    console.log(`Server is working http://localhost:${process.env.PORT}`);
});
