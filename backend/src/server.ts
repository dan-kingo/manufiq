import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./configs/db.js";

const PORT = process.env.PORT ?? 5000;
const URI = process.env.MONGO_URI;
async function start() {
  try {
    await connectDB(URI);


    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
