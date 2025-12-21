import mongoose from "mongoose";
const {model, Schema} = mongoose;

const cartSchema = Schema({
    user: {type: Schema.Types.ObjectId, ref: "user", required: true, index: true},
    products: [
        {
            product: {type: Schema.Types.ObjectId, ref: "product", required: true},
            qty: { type: Number, required: true, min: 1 }
        }
    ],
    deliveryCharges: {type: Number, min: 0, default: 0},
    totalAmount: {type: Number, required: true, min: 0, default: 0}
}, {timestamps: true});

export default model.Cart || model("Cart", cartSchema);