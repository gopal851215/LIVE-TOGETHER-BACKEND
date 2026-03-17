import express from "express";
import {
  createBooking,
  getMyBookings,
  getHostBookings,
  updateBookingStatus,
  hostVerification,
  sendReceiptEmail,
  cancelBooking
} from "../controllers/bookingController.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import { protect, hostOnly } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, getMyBookings);
router.get("/host", protect, hostOnly, getHostBookings);
router.put("/:id/status", protect, hostOnly, updateBookingStatus);
router.put("/:id/verify", protect, hostOnly, uploadMiddleware.single('verificationPhoto'), hostVerification);
router.delete("/:id", protect, cancelBooking);
// router.post("/:id/receipt-email", protect, hostOnly, sendReceiptEmail);

export default router;
