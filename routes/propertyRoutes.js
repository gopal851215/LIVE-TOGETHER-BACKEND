import express from "express";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getHostProperties,
  getComboByTypeAndSubType,
} from "../controllers/propertyController.js";
import { protect, hostOnly } from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

const router = express.Router();

// COMBO PROPERTIES
router.get("/combo", getComboByTypeAndSubType); // GET /api/properties/combo?type=room&subtype=girls

// OTHER PROPERTY ROUTES
router.get("/", getProperties);
router.get("/host", protect, hostOnly, getHostProperties);
router.get("/:id", getPropertyById);

router.post(
  "/",
  protect,
  hostOnly,
  uploadMiddleware.fields([
    { name: "houseImage", maxCount: 1 },
    { name: "indoorImages", maxCount: 6 },
    { name: "outdoorImages", maxCount: 6 },
    { name: "images", maxCount: 6 },
  ]),
  createProperty
);

router.put(
  "/:id",
  protect,
  hostOnly,
  uploadMiddleware.fields([
    { name: "houseImage", maxCount: 1 },
    { name: "indoorImages", maxCount: 6 },
    { name: "outdoorImages", maxCount: 6 },
    { name: "images", maxCount: 6 },
  ]),
  updateProperty
);

router.delete("/:id", protect, hostOnly, deleteProperty);

export default router;
