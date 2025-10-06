import { PrismaClient } from "@prisma/client";
import logger from "@utils/logger";

const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    logger.info("Connected to MongoDB using Prisma!");
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
  logger.info("Disconnected from MongoDB.");
}

export default prisma;
