import mongoose from "mongoose";
const {model, Schema} = mongoose;

const cartSchema = Schema({
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true, index: true},
    products: [
        {
            productId: {type: Schema.Types.ObjectId, ref: "Product", required: true},
            quantity: { type: Number, required: true, min: 1 },
            color: { type: String, required: true },
            size: { type: String, required: true }
        }
    ],
    deliveryCharges: {type: Number, min: 0, default: 0},
    totalAmount: {type: Number, required: true, min: 0, default: 0}
}, {timestamps: true});

export default model.Cart || model("Cart", cartSchema);