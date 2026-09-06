import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.ts";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(errorHandler);

export default app;
