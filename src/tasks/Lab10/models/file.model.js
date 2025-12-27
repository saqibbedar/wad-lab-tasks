import mongoose from "mongoose";

const { Schema, model } = mongoose;

const fileSchema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  storage: { type: String, required: true, enum: ["local", "s3", "gcs"], default: "local" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } 
}, { collection: "files", timestamps: true });

export default model.File || model("File", fileSchema);