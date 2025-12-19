import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import path from "path";
// import fs from "fs";
import { configDotenv } from "dotenv";

// models
import Product from "./models/product.model.js";


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

// only for local development; vercel uses public is default root dir for exposing static contents
// get static files using baseURL/views/add-products.html
app.use(express.static(path.join(process.cwd(), "/views")));
app.use("/public", express.static(path.join(process.cwd(), "/public")));


// test route
app.get("/", (req, res)=>{
    return res.send("Everything is working fine, please visit /api/products for product list or /public/views/add-product.html to add products.");
});

// api routes
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find({}).select("-__v -createdAt -updatedAt").lean();
        if(products) {
            return res.status(200).json({products})
        } else {
            return res.status(400).json({error: "Error while fetching records from database"});
        }
    } catch (error) {
        console.error("Error while creating product", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/api/products", async (req, res) => { 
    
try {
    const rawBody = req.body || {};
    // console.log(rawBody);
    // return res.status(200).json("Data received successfully");
    /**
       * {
          productType: 'asdfasdf',
          productCode: 'asdfa',
          name: 'asdf',
          description: 'sdfqasd',
          size: 'asdf',
          color: 'asdf',
          quantity: '23',
          price: '23'
          }
       */
  
    if (rawBody) {
      const {
        productType,
        productCode,
        name,
        description,
        size,
        color,
        quantity,
        price,
      } = rawBody;
  
      // validation
      const isCodeExist = await Product.findOne({productType, productCode}).lean();
      if(isCodeExist) {
          return res.status(409).json({error: "Product code already exists"});
      }

      const sizeArray = size.split(",").map(str=>str.trim());
      const colorArray = color.split(",").map(str=>str.trim());

    //   console.log(sizeArray);
    //   console.log(colorArray);

      const productPayload = {productType, productCode, name, description, size: sizeArray, color: colorArray, quantity, price};
      

      const newProduct = new Product({...productPayload});

      await newProduct.save();

      return res.status(200).json({message: "Product created successfully"});
    }
} catch (error) {
    console.error("Error while creating product", error);
    return res.status(500).json({ error: "Internal Server Error" });
}
})



app.listen((process.env.PORT || 8000), ()=>{
    console.log(`Server is working http://localhost:${process.env.PORT}`);
});
