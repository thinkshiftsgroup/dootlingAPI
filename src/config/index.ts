import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 8000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "mongodb+srv://root:root@cluster0.3dsfp.mongodb.net/selfanypay";
