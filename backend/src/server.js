import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { testConnection } from "./config/database.js";
import assetsRouter from "./routes/assets.js";
import userRolesRouter from "./routes/userRoles.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Vellum API",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/user-roles", userRolesRouter);
app.use("/api/assets", assetsRouter);

app.get("/", (_req, res) => {
  res.json({
    message: "Vellum API",
    endpoints: {
      health: "/api/health",
      assets: "/api/assets",
      userRoles: "/api/user-roles"
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: `${req.method} ${req.path}`
  });
});

app.use((error, _req, res, _next) => {
  console.error("Server error:", error);
  res.status(error.status || 500).json({
    error: error.message || "Internal Server Error"
  });
});

export async function startServer() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error("Failed to connect to database. Server not started.");
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Vellum API running on http://localhost:${PORT}`);
  });
}

export { app };

if (process.env.NODE_ENV !== "test") {
  void startServer();
}
