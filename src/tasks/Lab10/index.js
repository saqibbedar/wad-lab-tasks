// // Using "type":"module" defined in package.json for modern js import exports statements
// import bodyParser from "body-parser";
// import express, { application } from "express";
// import path from "path";
// import fs from "fs";
// import { configDotenv } from "dotenv";

// configDotenv();

// // for initial dataLoad
// let products = null;

// const app = express();

// // configs
// const PORT = 9000;
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
// const staticImagePath = path.join(process.cwd(), 'public/images');
// // console.log(staticImagePath);
// // forcing to expose images only on route /public/images => express will map it currentWorkingDir/public/images/<requested-images>
// app.use("/public/images", express.static(staticImagePath));

// // for HTML form to add product
// app.use("/views", express.static(path.join(process.cwd(), '/views')));

// // test route
// app.get("/", (req, res)=>{
//     console.log(`Requested URL: ${req.url || "failed to get URL"}`);
//     res.status(200).json({"message": "Server is working correctly!"});
// });

// // ----------------------- API ENDPOINTS (GET METHODS) ---------------------------

// // product list
// app.get("/api/products", (req, res) => {
//     if (products) {
//         res.status(200).json({"products":products});
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })

// // product via product code
// app.get("/api/products/code/:code", (req, res) => {
//     if(products) {
//         const productCode = req.params.code.toLowerCase() || "";
//         // console.log(productCode)
//         const filterProductsByCode = products.find(p => productCode === p.code.toLowerCase());
//         if(filterProductsByCode.length > 0) {
//             res.status(200).json({"productsByCode": filterProductsByCode});
//         } else {
//             res.status(404).json({"message": "The product you are looking for is either out of stock or not found in inventory."});
//         }
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })

// // product via product type
// app.get("/api/products/type/:type", (req, res) => {
//     if(products) {
//         const productType = req.params.type.toLowerCase() || "";
//         // console.log(productType)
//         const filterProductsByType = products.filter(p => productType === p.type.toLowerCase());
//         if(filterProductsByType.length > 0) {
//             res.status(200).json({"productsByType": filterProductsByType});
//         } else {
//             res.status(404).json({"message": "The product you are looking for is either out of stock or not found in inventory."});
//         }
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })

// // product via size
// app.get("/api/products/size/:size", (req, res) => {
//     if(products) {
//         const productSize = req.params.size.toUpperCase() || "";
//         // size is an array, check if requested size is available or not?
//         const filterProductsBySize = products.filter(p => p.size.includes(productSize));
//         if(filterProductsBySize.length > 0) {
//             res.status(200).json({"productsBySize": filterProductsBySize});
//         } else {
//             res.status(404).json({"message": "The product you are looking for is either out of stock or not found in inventory."});
//         }
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })

// // product via ratings: client should use /api/products/ratings?q=ascending or /ratings?q=descending
// app.get("/api/products/ratings", (req, res)=>{
//     if(products) {
        
//         // dummy array for sort and return in response
//         let arrayToSort = [...products];
        
//         const sortQuery = req.query || {};
//         // console.log(sortQuery);
//         const { q } = sortQuery;
//         // console.log(q);
        
//         if(q){
//             const {q} = sortQuery; // destructure query;
//             if(q.toLocaleLowerCase() === "descending") {
//                 let descendingOrder = arrayToSort.sort((a, b)=> b.ratings - a.ratings);
//                 res.status(200).json({"sortedProductsInDescendingOrder": descendingOrder});
//             } else if (q.toLowerCase() === "ascending") {
//                 let ascendingOrder = arrayToSort.sort((a, b)=> a.ratings - b.ratings);
//                 res.status(200).json({"sortedProductsInAscendingOrder": ascendingOrder});
//             }
//         } else {
//             // if no query passed send default product list
//             res.status(200).json({"products": products});
//         }
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })

// // search a product with type, name or description /api/search?q=<query>
// app.get("/api/products/search", (req, res) => {
//     if(products) {
//         const searchQuery = req.query || {};
//         const { q } = searchQuery;
        
//         if(q) {
//             let sq = q.toLocaleLowerCase(); // searchQuery

//             const filteredProducts = products.filter( p =>  
//                 p.type.toLowerCase().includes(sq) || 
//                 p.name.toLocaleLowerCase().includes(sq) ||
//                 p.description.toLocaleLowerCase().includes(sq)
//             );

//             if(filteredProducts.length > 0) {
//                 res.status(200).json({"searchResults": filteredProducts});
//             } else {
//                 res.status(404).json({"message": `No product found for search query ${q}`});
//             }
//         } else {
//             res.status(400).json({"error": "Invalid or empty query"});
//         }
        
//     } else {
//         res.status(404).json({"error": "Resource Not Found"});
//     }
// })


// // ----------------------- API ENDPOINTS (POST METHODS) ---------------------------
// app.post("/api/products/add", (req, res) => {
//     const reqBody = req.body || {};
//     if(reqBody) {
      
//       reqBody.isLimited = Number(reqBody.inStock) > 10 ? "true" : "false";
//       reqBody.ratings = 0;
//       products.push(reqBody);
//       fs.writeFile(`${process.cwd()}/public/data/products.json`, JSON.stringify(products), "utf-8", (err) => {
//         if(err) {
//             console.error(err);
//             return res.status(500).json({"error": "Unable to save product data"})
//         } else {
//             res.status(200).json({ message: "Product added successfully." });
//         }
//       });
//     } else {
//         res.status(400).json({ error: "Unable to add data" });
//     }
// });

// // Load data and run server
// const  loadProductsDataAndRunServer = () => {
//     fs.readFile(`${process.cwd()}/public/data/products.json`, (err, data) => {
//       if (err) {
//         console.error(err);
//       } else {
//         try {
//           // parse json
//           products = JSON.parse(data);
//           // confirm data load
//         //   products.forEach((p) => {
//         //     console.log(p);
//         //   });
//           // run server after data is loaded 
//           app.listen(PORT, ()=>{
//               console.log(`Server is running on http://localhost:${PORT}`);
//           });
//         } catch (error) {
//             console.log(`error while parsing json data: ${error}`);
//         }
//       }
//     });
// }

// loadProductsDataAndRunServer();


console.log("hello, world");