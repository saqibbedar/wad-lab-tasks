import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import path from "path";
// import fs from "fs";
import { configDotenv, populate } from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fs from "fs";




// models
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import Session from "./models/session.model.js";
import File from "./models/file.model.js";
import Cart from "./models/cart.model.js";

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

// app setup
const app = express();



// middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/tmp", express.static(path.join(process.cwd(), "/tmp"))); // to serve temp uploaded files in vercel

// ********************* constants.Utilities *****************************
// determine environment
const isLocalDev = true;

// 
const IMAGE_UPLOAD_DIR = path.join(
  process.cwd(),
  "tmp",
  "uploads",
  "product-images"
);
const imageUrlFor = (filename) => `/tmp/uploads/product-images/${filename}`;
const imageFsPathFor = (filename) => path.join(IMAGE_UPLOAD_DIR, filename);

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    await fs.promises.unlink(filePath);
  } catch (err) {
    // ignore missing files; log other errors
    if (err && err.code !== "ENOENT") {
      console.error("Error deleting file:", filePath, err);
    }
  }
}

// ***************************** API Routes *****************************

// Home directory
app.get("/", (req, res) => {
  res.redirect(
    isLocalDev ? "/public/project/homepage.html" : "/project/homepage.html"
  );
});


// get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({
        path: "image",
        select:
          "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id",
      })
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (products) {
      return res.status(200).json([...products]);
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


// ***************************** Admin Routes *****************************

// create a product - admin only
app.post(
  "/api/products",
  multerImageUploadErrorHandler(uploadImage.single("image")),
  authMiddleware,
  adminMiddleware(),
  async (req, res) => {
    try {
      const rawBody = req.body || {};
      console.log(
        "user",
        req.user,
        "isAdmin",
        req.isAdmin,
        "id:",
        req.user._id
      );
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
          isNewArrival,
        } = rawBody;

        if (!req.file || !req.file.path) {
          return res.json({ error: "Product Image is required" });
        }

        // validation
        const isCodeExist = await Product.findOne({
          productType,
          productCode,
        }).lean();
        if (isCodeExist) {
          // clean up uploaded image if product code already exists
          if (req.file && req.file.path) {
            await safeUnlink(req.file.path);
          }
          return res.status(409).json({ error: "Product code already exists" });
        }

        const sizeArray = size.split(",").map((str) => str.trim());
        const colorArray = color.split(",").map((str) => str.trim());

        //   console.log(sizeArray);
        //   console.log(colorArray);

        let imageFile = {
          filename: req.file.filename || "",
          url: imageUrlFor(req.file.filename) || "",
          mimeType: req.file.mimetype || "",
          size: req.file.size || 0,
          storage: "local",
          uploadedBy: req.user._id ? req.user._id : null,
        };

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
          isNewArrival: isNewArrival.toLowerCase() === "yes" ? true : false,
        };

        const newProduct = new Product({ ...productPayload });

        await newProduct.save();

        return res.redirect("/admin/product-list.html");
      }
    } catch (error) {
      console.error("Error while creating product", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// update a product - admin only
app.put(
  "/api/products/:productId",
  multerImageUploadErrorHandler(uploadImage.single("image")),
  authMiddleware,
  adminMiddleware(),
  async (req, res) => {
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
          isNewArrival,
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
          isNewArrival: isNewArrival.toLowerCase() === "yes" ? true : false,
        };

        // check if new image is uploaded
        if (req.file && req.file.path) {
          // first find existing product to get image file id
          const existingProduct = await Product.findById(productId).lean();
          if (existingProduct && existingProduct.image) {
            const existingImageFile = await File.findById(
              existingProduct.image
            ).lean();
            if (existingImageFile) {
              // delete physical file
              await safeUnlink(imageFsPathFor(existingImageFile.filename));
              // delete file record
              await File.findByIdAndDelete(existingProduct.image);
            }
          }

          // create new file record
          let newImageFile = {
            filename: req.file.filename || "",
            url: imageUrlFor(req.file.filename) || "",
            mimeType: req.file.mimetype || "",
            size: req.file.size || 0,
            storage: "local",
            uploadedBy: req.user._id ? req.user._id : null,
          };

          newImageFile = await File.create(newImageFile);
          updatePayload.image = newImageFile._id;
        }
        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          updatePayload,
          { new: true }
        );
        if (updatedProduct) {
          return res
            .status(200)
            .json({ message: "Product updated successfully" });
        } else {
          return res.status(404).json({ error: "Product not found" });
        }
      }
    } catch (error) {
      console.error("Error while updating product", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// delete a product - admin only
app.delete(
  "/api/products/:id",
  authMiddleware,
  adminMiddleware(),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const deletedProduct = await Product.findByIdAndDelete(productId);
      if (deletedProduct) {
        // also delete associated image file record
        if (deletedProduct.image) {
          const imageFile = await File.findById(deletedProduct.image);
          if (imageFile) {
            // delete physical file
            await safeUnlink(imageFsPathFor(imageFile.filename));
            // delete file record
            await File.findByIdAndDelete(deletedProduct.image);
          }
        }
        return res
          .status(200)
          .json({ message: "Product deleted successfully" });
      } else {
        return res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error("Error while deleting product", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// ********************** Public API Routes *****************************

// search a product with type, name or description /api/search?q=<query>
app.get("/api/products/search", async (req, res) => {
  try {
    const searchQuery = req.query || {};
    const { q } = searchQuery;

    // console.log(q);

    if (q) {
      const products = await Product.find({})
        .populate({
          path: "image",
          select:
            "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id",
        })
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
        return res.status(200).json({ searchResults: filteredProducts });
      } else {
        res.status(200).json({
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

// new arrival
app.get("/api/products/:q", async (req, res) => {
  try {
    const q = req.params.q;
    let isNewArrival = q === "true" ? true : false;
    // console.log("api/products/:q ",isNewArrival)
    const products = await Product.find({ isNewArrival })
      .populate({
        path: "image",
        select:
          "-__v -createdAt -updatedAt -uploadedBy -storage -size -mimeType -_id",
      })
      .select("-__v -createdAt -updatedAt")
      .lean();
    // console.log("products:", products);
    if (products) {
      return res.status(200).json({ products: [...products] });
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

// ********************** User Auth Routes *****************************

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
    const tokenExpiryTime = 1000 * 60 * 60 * 24; // 1 day

    await Session.create({
      token,
      user: user._id,
      expiresAt: new Date(Date.now() + tokenExpiryTime),
    });

    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: tokenExpiryTime,
    });

    res.status(200).json({
      message: "Login successfully",
      user: {
        _id: user._id,
        username: user.username,
        isLoggedIn: true,
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
    await Session.deleteOne({ token });
  }
  res.clearCookie("auth-token");
  res.redirect(
    isLocalDev ? "/public/project/homepage.html" : "/project/homepage.html"
  );
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
      return res.status(400).json({
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
    return res.status(201).json({
      message: "Signup successful",
      user: {
        _id: newUser._id,
        username: newUser.username,
      },
    }); 
  } catch (error) {
    console.error("Error while creating user", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// *********************** Cart Routes *****************************
app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const userCart = await Cart.findOne({ userId: req.user._id }).populate({
      path: "products.productId",
      select: "name price image isNewArrival productType",
      populate: {
        path: "image",
        select: "url"
      },
    }).select("-__v -updatedAt -createdAt");
    if(userCart) {
      // console.log(userCart);
      return res.status(200).json({cart: userCart, message: "Cart fetched successfully"});
    } else {
      return res.status(400).json({error: "Cart is empty"});
    }
  } catch (error) {
    console.error("Error while fetching user cart", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
})

app.post("/api/cart", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    let { productId, quantity, color, size } = req.body;

    quantity = Number(quantity);

    if (!productId || !color || !size || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Enter all required fields" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        products: [],
        deliveryCharges: 0,
        totalAmount: 0,
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: "Not in stock" });
    }

    const productItem = cart.products.find(
      (p) =>
        p.productId.toString() === productId &&
        p.color === color &&
        p.size === size
    );

    if (productItem) {
      productItem.quantity += quantity;
    } else {
      cart.products.push({ productId, quantity, color, size });
    }

    // update totals
    cart.totalAmount += product.price * quantity;
    cart.deliveryCharges = Number(cart.totalAmount) >= 5000 ? 0 : 250;

    // decrement product 
    product.quantity -= quantity;

    await product.save();
    await cart.save();

    return res.status(200).json({ message: "Updated cart successfully" });
  } catch (error) {
    console.error("Error while updating user cart", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/cart", authMiddleware, async (req, res) => {
  try {
    const { cartId, productId, cartItemId } = req.query;

    const cart = await Cart.findById(cartId).populate({
      path: "products.productId",
      select: "price",
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemToDeleteFromCart = cart.products.find(
      (p) => String(p._id) === cartItemId
    );

    if (!itemToDeleteFromCart) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const product = await Product.findById(productId).select("quantity");

    // restore stock
    product.quantity += itemToDeleteFromCart.quantity;

    // remove item
    cart.products = cart.products.filter((p) => String(p._id) !== cartItemId);

    // calculate total
    cart.totalAmount = cart.products.reduce((sum, p) => {
      return sum + p.productId.price * p.quantity;
    }, 0);

    cart.deliveryCharges = cart.totalAmount >= 5000 ? 0 : 250;

    await product.save();
    await cart.save();

    return res.status(200).json({ message: "Product removed from cart" });
  } catch (error) {
    console.error("Error while updating user cart", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// app.get("/api/test", authMiddleware, adminMiddleware(), async (req, res) => {
//   // auth middleware is returning user which contains username and _id, in req.user and it also sends req.isAdmin flag to tell if user is admin or not, isAdmin saves a query because we are already looking up for user and admin is user too. In authMiddleware, it just confirms if username is admin, if yes then he is allowed to perform admin level operations
//   return res.send(`userId=${req.user._id}, fullUser: ${req.user}, isAdmin: ${req.isAdmin}`);
// });

// only for local development; vercel uses public is default root dir for exposing static contents
// get static files using baseURL/views/add-products.html
// serving static files after api to avoid express not found error

// views are now added into admin for product crud operations.
app.use(
  "/admin",
  authMiddleware,
  adminMiddleware(),
  express.static(path.join(process.cwd(), "/admin"))
);
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
