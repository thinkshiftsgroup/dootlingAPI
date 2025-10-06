import app from "./app";
import { PORT, NODE_ENV } from "@config/index";
import { connectDB, disconnectDB } from "@config/db";
import logger from "@utils/logger";

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    logger.info(`Access it at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down server...");
    await disconnectDB();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer();
