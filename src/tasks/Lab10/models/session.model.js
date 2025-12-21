import mongoose from "mongoose";
const { Schema, model } = mongoose;

const sessionSchema = Schema({
    token: {type: String, required: true, unique: true, index: true},
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    expiresAt: {type: Date, required: true}
}, {timestamps: true});

export default model.Session || model("Session", sessionSchema);