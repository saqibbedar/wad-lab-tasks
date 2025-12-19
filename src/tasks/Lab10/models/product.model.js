import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSchema = new Schema({
  productType: { type: String, required: true, index: true },
  productCode: { type: String, required: true, uppercase: true, index: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: {type: Number, required: true},
  size: {type: []},
  color: {type: []},
  quantity: {type: Number}
}, {collection: "products", timestamps: true, });

export default model.Product || model("Product", productSchema);