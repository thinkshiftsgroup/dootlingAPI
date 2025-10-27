import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "@middlewares/error.middleware";

import { authRouter } from "@routes/auth.routes";
import { profileRouter } from "@routes/profile.route";
import { followsRouter } from "@routes/follows.router";
import { connectionsRouter } from "@routes/serviceConnection.router";
import { projectRouter } from "@routes/project.route";
import { milestonesRouter } from "@routes/project.milestone.route";
import { homeRouter } from "@routes/home.route";
const app = express();

const allowedOrigins = [
  "http://dootling.com",
  "https://dootling.com",
  "https://www.dootling.com",
  "http://localhost:3000",
  "http://localhost:3002",
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/follows", followsRouter);
app.use("/api/connections", connectionsRouter);
app.use("/api/projects", projectRouter);
app.use("/api/milestones", milestonesRouter);
app.use("/api/home", homeRouter);

app.get("/health", async (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", message: "Service is healthy" });
});

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <div style="text-align:center;margin-top:10rem">
      Welcome to Dootling 😜
    </div>
  `);
});

app.use(errorHandler);

export default app;
