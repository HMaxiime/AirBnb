import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { connectDB } from "./config/prisma.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupSwagger } from "./config/swagger.js";
import compression from "compression";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import v1Router from "./routes/v1/index.js";
import morgan from "morgan";
import cors from "cors";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://airbnb-avpo.onrender.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
); // Allow CORS for the frontend development server

// Middleware order matters here: compression and rate limiting run before JSON parsing.
app.use(compression());
app.use(generalLimiter);
app.use(express.json());
app.use(
  process.env["NODE_ENV"] === "production" ? morgan("combined") : morgan("dev"),
);

// Swagger is mounted before the API routes so the docs are available as soon as the app starts.

setupSwagger(app); // Set up Swagger documentation
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.use("/api/v1", v1Router);

// Error handling must come last so it can catch failures from every route above.
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});
app.use(errorHandler); // Global error handler for all routes
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

async function startServer() {
  try {
    // Connect to the database before opening the HTTP port.
    await connectDB();
    console.log("Database connection established successfully.");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the process with an error code
  }
}

startServer();
