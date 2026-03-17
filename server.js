import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config({ quiet: true });
connectDB();

const app = express();

/* ---------- MIDDLEWARE ---------- */

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- SERVE UPLOADED IMAGES ---------- */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ---------- ROUTES ---------- */

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);

/* ---------- TEST ROUTE ---------- */

app.get("/", (req, res) => {
  res.send("Student Housing & Intern Room Booking API");
});

/* ---------- ERROR HANDLER ---------- */

app.use(notFound);
app.use(errorHandler);

/* ---------- SERVER ---------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});