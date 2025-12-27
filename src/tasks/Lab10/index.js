import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import path from "path";
// import fs from "fs";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fs from "fs";

// models
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import Session from "./models/session.model.js";
import File from "./models/file.model.js";

// utils
import { comparePassword, hashPassword } from "./utils/bcrypt.utils.js";

// middlewares
import authMiddleware from "./middleware/auth.middleware.js";
import { multerImageUploadErrorHandler } from "./middleware/handleLargeFileUpload.middleware.js";
import adminMiddleware from "./middleware/admin.middleware.js";

// config
import uploadImage from "./config/imageUpload.config.js"; 
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
const isLocalDev = Boolean(process.env.isLocalDev) || false;

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

// Home directory
app.get("/", (req, res) => {
  // let homeHTML = `
  //       <h1>Server is working</h1>
  //       <ul>
  //           <li>Visit baseURL/api/products for product list</li>
  //           <li>Visit baseURL/views/add-product.html to add new products</li>
  //           <li>Visit baseURL/api/products/:code to get product via code <strong>OR</strong></li>
  //           <li>Visit baseURL/api/products/search?q=YOUR_QUERY to search any product based on name, or description</li>
  //       </ul>
  //       <h1>Wad Project Access</h1>
  //       <ul>
  //         <li>Visit baseURL/project/homepage.html for project access</li>
  //       </ul>
  //       <h3> Debugging </h3>
  //       <ul>
  //           <li>MongoURI: ${
  //             process.env.MONGODB_URI
  //               ? "MONGO_URI is working"
  //               : "Error in setting up MONGO_URI"
  //           }</li>
  //       </ul>
  //   `;

  // return res.type("html").send(homeHTML);
  res.redirect(isLocalDev ? "/public/project/homepage.html" : "/project/homepage.html");

});

// ***************************** Admin Routes *****************************

// get all products 
app.get("/api/products", async (req, res) => {
  try {
    // await connectDB(); // serverless
    const products = await Product.find({}).populate({path: "image", select: "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id"})
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (products) {
      const productPayload = products.map((product) => {
        if (product.image && product.image.filename) {
          // console.log("product image found:", product.image.filename);
          // console.log("isLocalDev:", isLocalDev);
          // console.log("product image url before:", product.image.url);
          product.image.url = isLocalDev ? `/public${product.image.url}` : `${product.image.url}`;
          // console.log("product image url after:", product.image.url);
        }
        return product;
      });
      return res.status(200).json([...productPayload]);
    } else {
      return res
        .status(400)
        .json({ error: "Error while fetching records from database" });
    }
  } catch (error) {
    console.error("Error in fetching products details", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// create a product - admin only
app.post("/api/products", multerImageUploadErrorHandler(uploadImage.single("image")), authMiddleware, adminMiddleware(), async (req, res) => {
  try {
    const rawBody = req.body || {};
    console.log("user", req.user, "isAdmin", req.isAdmin, "id:", req.user._id);
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
        isNewArrival
      } = rawBody;

      if(!req.file || !req.file.path) {
        return res.json({"error": "Product Image is required"});
      }

      // validation
      const isCodeExist = await Product.findOne({
        productType,
        productCode,
      }).lean();
      if (isCodeExist) {
        // clean up uploaded image if product code already exists
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.error("Error deleting uploaded file:", err);
            }
          });
        }
        return res.status(409).json({ error: "Product code already exists" });
      }

      const sizeArray = size.split(",").map((str) => str.trim());
      const colorArray = color.split(",").map((str) => str.trim());

      //   console.log(sizeArray);
      //   console.log(colorArray);

      let imageFile = {
        filename: req.file.filename || "",
        url: `/uploads/product-images/${req.file.filename}` || "",
        mimeType: req.file.mimetype || "",
        size: req.file.size || 0,
        storage: "local",
        uploadedBy: req.user._id ? req.user._id : null
      }

      imageFile = await File.create(imageFile);

      const productPayload = {
        image: imageFile._id,
        productType,
        productCode,
        name,
        description,
        size: sizeArray,
        color: colorArray,
        quantity,
        price,
        isNewArrival: isNewArrival.toLowerCase() === "yes" ? true : false
      };

      const newProduct = new Product({ ...productPayload });

      await newProduct.save();

      return res.redirect("/admin/product-list.html");
    }
  } catch (error) {
    console.error("Error while creating product", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// update a product - admin only
app.put("/api/products/:productId", multerImageUploadErrorHandler(uploadImage.single("image")), authMiddleware, adminMiddleware(), async (req, res) => { 
  try {
    const productId = req.params.productId || "";
    const rawBody = req.body || {};
    // get existing product
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
        isNewArrival
        } = rawBody;
      // setup update payload
      const sizeArray = size.split(",").map((str) => str.trim());
      const colorArray = color.split(",").map((str) => str.trim());
      const updatePayload = {
        productType,
        productCode,
        name,
        description,
        size: sizeArray,
        color: colorArray,
        quantity,
        price,
        isNewArrival: isNewArrival.toLowerCase() === "yes" ? true : false
      };

      // check if new image is uploaded
      if (req.file && req.file.path) {
        // first find existing product to get image file id
        const existingProduct = await Product.findById(productId).lean();
        if (existingProduct && existingProduct.image) {
          const existingImageFile = await File.findById(existingProduct.image).lean();
          if (existingImageFile) {
            // delete physical file
            const imagePath = path.join(process.cwd(), existingImageFile.storage === "local" ? `/public/uploads/product-images/${existingImageFile.filename}` : existingImageFile.filename);
            fs.unlink(imagePath, (err) => {
              if (err) {
                console.error("Error deleting existing image file:", err);
              }
            });
            // delete file record
            await File.findByIdAndDelete(existingProduct.image);
          }
        }

        // create new file record
        let newImageFile = {
          filename: req.file.filename || "",
          url: `/uploads/product-images/${req.file.filename}` || "",
          mimeType: req.file.mimetype || "",
          size: req.file.size || 0,
          storage: "local",
          uploadedBy: req.user._id ? req.user._id : null
        }

        newImageFile = await File.create(newImageFile);
        updatePayload.image = newImageFile._id;
      }
      const updatedProduct = await Product.findByIdAndUpdate(productId, updatePayload, { new: true });
      if (updatedProduct) {
        return res.status(200).json({ message: "Product updated successfully" });
      } else {
        return res.status(404).json({ error: "Product not found" });
      }
    }
  } catch (error) {
    console.error("Error while updating product", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
})

// delete a product - admin only
app.delete("/api/products/:id", authMiddleware, adminMiddleware(), async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (deletedProduct) {
      // also delete associated image file record
      if (deletedProduct.image) {
        const imageFile = await File.findById(deletedProduct.image);
        if (imageFile) {
          // delete physical file
          const imagePath = path.join(process.cwd(), imageFile.storage === "local" ? `/public/uploads/product-images/${imageFile.filename}` : imageFile.filename);
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting associated image file:", err);
            }
          });
          // delete file record
          await File.findByIdAndDelete(deletedProduct.image);
        }
      }
      return res.status(200).json({ message: "Product deleted successfully" });
    } else {
      return res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Error while deleting product", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// TX01: testing
// app.post("/api/test-image", multerImageUploadErrorHandler(uploadImage.single("image")), async (req, res) => { 
//   try {
//     console.log("file:", req.file);
//     // sleep for 10 seconds;
//     const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
//     await sleep(1000 * 5); // wait for 10 seconds to ensure file is written
//     if (req.file && req.file.path) {
//       console.log("Uploaded file path:", req.file.path);
//       // clean up uploaded image after test
//       fs.unlink(req.file.path, (err) => {
//         if (err) {
//           console.error("Error deleting uploaded file:", err);
//         }
//       });
//     }
//     res.json({ message: "Image uploaded and deleted successfully" });
//   } catch (error) {
//     console.error("Error in image upload test route:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// other routes

// search a product with type, name or description /api/search?q=<query>
app.get("/api/products/search", async (req, res) => {
  try {
    const searchQuery = req.query || {};
    const { q } = searchQuery;

    // console.log(q);

    if (q) {
      const products = await Product.find({}).populate({path: "image", select: "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id"})
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
        const productPayload = filteredProducts.map((product) => {
          if (product.image && product.image.filename) {
            product.image.url = isLocalDev ? `/public${product.image.url}` : `${product.image.url}`;
          }
          return product;
        });
        return res.status(200).json({ searchResults: productPayload });
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
    console.error("Error while fetching products via search query", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// FX01: feature (enhanced one)
// app.get("/api/products/search", async (req, res) => {
//   try {
//     const {q, skip=0, limit=4} = req.query;
//     if(!q) {
//       res.status(400).json({error: "Invalid or empty query"});
//     }
//     const sq = q.toLocaleLowerCase(); // search query
    
//     const query = {
//       $or: [
//         { productType: { $regex: sq, $options: "i" } },
//         { name: { $regex: sq, $options: "i" } },
//         { description: { $regex: sq, $options: "i" } },
//       ],
//     };

//     const products = await Product.find(query)
//       .select("-__v -createdAt -updatedAt")
//       .skip(Number(skip))
//       .limit(Number(limit))
//       .lean();

//     const totalCount = await Product.countDocuments(query);

//     res.status(200).json({
//       searchResults: products,
//       total: totalCount,
//       hasMore: skip + products.length < totalCount,
//     });

//   } catch (error) {
//     console.error("Search error", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// new arrival
app.get("/api/products/:q", async (req, res) => {
  try {
    const q = req.params.q;
    let isNewArrival = q === "true" ? true : false;
    // console.log("api/products/:q ",isNewArrival)
    const products = await Product.find({isNewArrival}).populate({path: "image", select: "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id"})
      .select("-__v -createdAt -updatedAt")
      .lean();
      // console.log("products:", products);
    if (products) {
      const productPayload = products.map((product) => {
        if (product.image && product.image.filename) {
          product.image.url = isLocalDev ? `/public${product.image.url}` : `${product.image.url}`;
        }
        return product;
      });
      // console.log("productPayload:", productPayload);
      return res.status(200).json({ products: productPayload });
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


// app.get("/api/products/:code", authMiddleware, adminMiddleware(), async (req, res) => {
//   try {
//     const productCode = req.params.code.toUpperCase();
//     const products = await Product.findOne({ productCode }).select(
//       "-__v -createdAt -updatedAt"
//     );
//     if (products) {
//       res.status(200).json({ productsByCode: products });
//     } else {
//       res
//         .status(404)
//         .json({
//           message: `The product you requested with product code ${productCode} can't be found, please try a different correct code.`,
//         });
//       // res.status(404).json({error: "Requested product not found"});
//     }
//   } catch (error) {
//     console.error("Error while fetching products via codes", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// cookie based login for 1 day

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with provided username" });
    }

    const isMatched = await comparePassword(password, user.password);
    if (!isMatched) {
      return res.status(401).json({ error: "Password does not match" });
    }

    // delete old sessions
    await Session.deleteMany({ user: user._id });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiryTime = 1000 * 60 * 60 * 24; // 24hrs = 1day

    await Session.create({
      token,
      user: user._id,
      expiresAt: new Date(Date.now() + tokenExpiryTime)
    });

    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: tokenExpiryTime
    });

    res.status(200).json({
      message: "Login successfully",
      user: {
        _id: user._id,
        username: user.username,
        isLoggedIn: true
      },
    });
  } catch (error) {
    console.error("Error while logging user in", error);
    res.status(500).json({ error: "Internal Server Error" });
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

// bulk request
app.post("/api/products/bulk-ids", async (req, res) => {
  const { productIds } = req.body;

  const products = await Product.find({
    _id: { $in: productIds },
  }).lean();

  res.json(products);
});


app.get("/api/test", authMiddleware, adminMiddleware(), async (req, res) => {
  // auth middleware is returning user which contains username and _id, in req.user and it also sends req.isAdmin flag to tell if user is admin or not, isAdmin saves a query because we are already looking up for user and admin is user too. In authMiddleware, it just confirms if username is admin, if yes then he is allowed to perform admin level operations
  return res.send(`userId=${req.user._id}, fullUser: ${req.user}, isAdmin: ${req.isAdmin}`);
});

// only for local development; vercel uses public is default root dir for exposing static contents
// get static files using baseURL/views/add-products.html
// serving static files after api to avoid express not found error

// views are now added into admin for product crud operations.
app.use("/admin", authMiddleware, adminMiddleware(), express.static(path.join(process.cwd(), "/admin"))); 
// for local development only
app.use("/public", express.static(path.join(process.cwd(), "/public")));

// for local development
const launchApp = async () => {
  await connectDB();
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is working http://localhost:${process.env.PORT}`);
  });
};

launchApp();
