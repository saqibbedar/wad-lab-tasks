import mongoose from "mongoose";
const {Schema, model} = mongoose;

const userSchema = Schema({
    username: {type: String, required: true, unique: true, index: true},
    password: {type: String, required: true}
}, {timestamps: true});

export default model.User || model("User", userSchema);