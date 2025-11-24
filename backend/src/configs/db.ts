import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function connectDB(mongoUri?: string) {
  const uri = mongoUri ?? process.env.MONGO_URI!;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // options if needed
  });

  console.log("✅ Connected to MongoDB");
}