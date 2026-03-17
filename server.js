import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./api/auth.js";
import propertyRoutes from "./api/properties.js";
import bookingRoutes from "./api/booking.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config({ quiet: true });

// Initialize Express app
const app = express();

/* ---------- MIDDLEWARE ---------- */

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- SERVE UPLOADED IMAGES ---------- */

app.use("/uploads", express.static(path.join(process.cwd(), "backend/uploads")));

/* ---------- ROUTES ---------- */

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);

/* ---------- TEST ROUTE ---------- */

app.get("/", (req, res) => {
  res.json({ message: "Student Housing & Intern Room Booking API 🚀" });
});

/* ---------- ERROR HANDLER ---------- */

app.use(notFound);
app.use(errorHandler);

/** ---------- VERCEL SERVERLESS HANDLER ---------- **/
export default async function handler(req, res) {
  try {
    // Lazy database connection
    await connectDB();
    
    // Handle the request with Express
    app(req, res);
    
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "production" ? undefined : error.message 
    });
  }
}

