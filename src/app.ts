import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "@middlewares/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/health", async (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", message: "Service is healthy" });
});

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <div style="text-align:center;margin-top:10rem">
      Welcome to SelfanyPay 😜
    </div>
  `);
});

app.use(errorHandler);

export default app;
