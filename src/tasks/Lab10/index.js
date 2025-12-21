import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import path from "path";
// import fs from "fs";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";

// models
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import Session from "./models/session.model.js";

// utils
import { comparePassword, hashPassword } from "./utils/bcrypt.utils.js";

// middlewares
import authMiddleware from "./middleware/auth.middleware.js";

// config
configDotenv();

// db connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (uri) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("connected to database");
    }
  } catch (e) {
    console.error(e);
  }
};

// instance
const app = express();
const isLocalDev = process.env.isLocalDev || false;

// middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// debugger
// app.use((req, res, next) => {
//   console.log("REQ:", req.method, req.url);
//   next();
// });

// test route
app.get("/", (req, res) => {
  let homeHTML = `
        <h1>Server is working</h1>
        <ul>
            <li>Visit baseURL/api/products for product list</li>
            <li>Visit baseURL/views/add-product.html to add new products</li>
            <li>Visit baseURL/api/products/:code to get product via code <strong>OR</strong></li>
            <li>Visit baseURL/api/products/search?q=YOUR_QUERY to search any product based on name, or description</li>
        </ul>
        <h1>Wad Project Access</h1>
        <ul>
          <li>Visit baseURL/project/homepage.html for project </li>
        </ul>
        <h3> Debugging </h3>
        <ul>
            <li>MongoURI: ${
              process.env.MONGODB_URI
                ? "MONGO_URI is working"
                : "Error in setting up MONGO_URI"
            }</li>
        </ul>
    `;

  return res.type("html").send(homeHTML);
});

// api routes
app.get("/api/products", async (req, res) => {
  try {
    // await connectDB(); // serverless
    const products = await Product.find({})
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (products) {
      return res.status(200).json({ products });
    } else {
      return res
        .status(400)
        .json({ error: "Error while fetching records from database" });
    }
  } catch (error) {
    console.error("Error in fetching projects details", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

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
      const isCodeExist = await Product.findOne({
        productType,
        productCode,
      }).lean();
      if (isCodeExist) {
        return res.status(409).json({ error: "Product code already exists" });
      }

      const sizeArray = size.split(",").map((str) => str.trim());
      const colorArray = color.split(",").map((str) => str.trim());

      //   console.log(sizeArray);
      //   console.log(colorArray);

      const productPayload = {
        productType,
        productCode,
        name,
        description,
        size: sizeArray,
        color: colorArray,
        quantity,
        price,
      };

      const newProduct = new Product({ ...productPayload });

      await newProduct.save();

      return res.status(200).json({ message: "Product created successfully" });
    }
  } catch (error) {
    console.error("Error while creating product", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// other routes
// search a product with type, name or description /api/search?q=<query>
app.get("/api/products/search", async (req, res) => {
  try {
    const searchQuery = req.query || {};
    const { q } = searchQuery;

    console.log(q);

    if (q) {
      const products = await Product.find({})
        .select("-__v -createdAt -updatedAt")
        .lean();
      // console.log(products)
      let sq = q.toLowerCase(); // searchQuery

      const filteredProducts = products.filter(
        (p, index) =>
          String(p.productType ?? "")
            .toLowerCase()
            .includes(sq) ||
          String(p.name ?? "")
            .toLowerCase()
            .includes(sq) ||
          String(p.description ?? "")
            .toLowerCase()
            .includes(sq)
      );

      // console.log(filteredProducts)

      if (filteredProducts.length > 0) {
        res.status(200).json({ searchResults: filteredProducts });
      } else {
        res
          .status(200)
          .json({
            message: `No product found for search query ${q}`,
            searchResults: `No product found for search query ${q}`,
          });
      }
    } else {
      res.status(400).json({ error: "Invalid or empty query" });
    }
  } catch (error) {
    console.error("Error while fetching products via codes", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// product via product code
app.get("/api/products/:code", async (req, res) => {
  try {
    const productCode = req.params.code.toUpperCase();
    const products = await Product.findOne({ productCode }).select(
      "-__v -createdAt -updatedAt"
    );
    if (products) {
      res.status(200).json({ productsByCode: products });
    } else {
      res
        .status(404)
        .json({
          message: `The product you requested with product code ${productCode} can't be found, please try a different correct code.`,
        });
      // res.status(404).json({error: "Requested product not found"});
    }
  } catch (error) {
    console.error("Error while fetching products via codes", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// cookie based login for 1 day
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    // console.log(req.body);
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }
    if (
      password.length < 5 ||
      password.length > 8 ||
      username.length < 5 ||
      username.length > 15
    ) {
      return res
        .status(400)
        .json({
          error:
            "Incorrect username or password length, minimum length allowed is 5 and max 15",
        });
    }
    const user = await User.findOne({ username })
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with provided username" });
    }
    const isMatched = await comparePassword(password, user.password);
    if (!isMatched) {
      return res.status(401).json({ error: "Password does not match" });
    }

    // raw token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiryTime = 24 * 60 * 60 * 1000;
    await Session.create({
      token,
      userId: user._id,
      expiresAt: new Date(Date.now()) + tokenExpiryTime,
    });

    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: tokenExpiryTime,
    });
    const payload = {
      _id: user._id,
      username: user.username,
      isLoggedIn: true
    };
    return res
      .status(200)
      .json({ message: "Login successfully", user: payload });
  } catch (error) {
    console.error("Error while logging user in", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/logout", async (req, res) => {
    const token = req.cookies["auth-token"];
    if (token) {
      await Session.deleteOne({token});
    }
    res.clearCookie("auth-token");
    res.redirect(isLocalDev ? "/public/project/homepage.html" : "/project/homepage.html");
});

app.post("/api/signup", async (req, res) => {
  try {
    let { username, password } = req.body;
    console.log(req.body);
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }
    if (
      password.length < 5 ||
      password.length > 8 ||
      username.length < 5 ||
      username.length > 15
    ) {
      return res
        .status(400)
        .json({
          error:
            "Incorrect username or password length, minimum length allowed is 5 and max 15",
        });
    }
    const isAlreadyExist = await User.findOne({ username });
    if (isAlreadyExist) {
      return res
        .status(401)
        .json({ error: `User already exists with username ${username}` });
    }
    password = await hashPassword(password);
    let newUser = new User({ username, password });
    console.log(newUser);
    await newUser.save();
    return res.redirect("/public/project/pages/Login.html");
  } catch (error) {
    console.error("Error while creating user", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// profile
// app.get("/api/profile/username", authMiddleware, async (req, res) => {
    
//   return res.json("You are authorized");
// });

// only for local development; vercel uses public is default root dir for exposing static contents
// get static files using baseURL/views/add-products.html
// serving static files after api to avoid express not found error
app.use(express.static(path.join(process.cwd(), "/views")));
app.use("/public", express.static(path.join(process.cwd(), "/public")));

// for local development
const launchApp = async () => {
  await connectDB();
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is working http://localhost:${process.env.PORT}`);
  });
};

launchApp();
