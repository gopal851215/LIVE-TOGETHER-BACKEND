import asyncHandler from "express-async-handler";
import Property from "../models/Property.js";
import Booking from "../models/Booking.js";

/* =========================================
   CREATE PROPERTY (Cloudinary Fixed)
========================================= */
export const createProperty = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    bhkType,
    allowedMembers,
    pricePerMonth,
    perSeatPrice,
    fullHousePrice,
    minimumStay,
    maximumStay,
    city,
    location,
    nearbyPlace,
    distance,
    internStyle,
    kitchen,
    bathroom,
    toilet,
    electricityFree,
    waterFree,
    rules,
    allowedFor,
  } = req.body;

  // ✅ CLOUDINARY URLS (FINAL FIX)
  const houseImage = req.files?.houseImage?.[0]?.path || "";

  const indoorImages =
    req.files?.indoorImages?.map((file) => file.path) || [];

  const outdoorImages =
    req.files?.outdoorImages?.map((file) => file.path) || [];

  const parsedAllowedMembers = Number(allowedMembers) || 1;
  const parsedPrice = Number(pricePerMonth);
  const parsedPerSeatPrice = Number(perSeatPrice) || 0;
  const parsedFullHousePrice = Number(fullHousePrice) || parsedPrice;
  const parsedMin = Number(minimumStay);
  const parsedMax = Number(maximumStay);

  const property = await Property.create({
    title,
    type,
    bhkType: type === "room" ? undefined : bhkType,
    internStyle: type === "intern" ? internStyle || "room" : undefined,
    allowedMembers: parsedAllowedMembers,
    ownerName: req.body.ownerName || "",
    ownerEmail: req.body.ownerEmail || "",
    pricePerMonth: parsedPrice,
    perSeatPrice: parsedPerSeatPrice,
    fullHousePrice: parsedFullHousePrice,
    minimumStay: parsedMin,
    maximumStay: parsedMax,
    city,
    location,
    nearbyPlace,
    distance,
    kitchen,
    bathroom,
    toilet,
    electricityFree,
    waterFree,
    rules,
    allowedFor,
    houseImage,
    indoorImages,
    outdoorImages,
    hostId: req.user._id,
    availableSeats: parsedAllowedMembers,
  });

  res.status(201).json(property);
});

/* =========================================
   GET ALL PROPERTIES
========================================= */
export const getProperties = asyncHandler(async (req, res) => {
  const { type, allowedFor, city, minPrice, maxPrice, search } = req.query;

  const query = { status: "available" };

  if (type) {
    if (type === "room") {
      query.$or = [{ type: "room" }, { type: "intern", internStyle: "room" }];
    } else if (type === "flat") {
      query.$or = [{ type: "flat" }, { type: "intern", internStyle: "flat" }];
    } else {
      query.type = type;
    }
  }

  if (allowedFor) query.allowedFor = allowedFor;
  if (city) query.city = new RegExp(city, "i");
  if (search) query.title = new RegExp(search, "i");

  if (minPrice) query.pricePerMonth = { $gte: Number(minPrice) };
  if (maxPrice) query.pricePerMonth = { $lte: Number(maxPrice) };

  const properties = await Property.find(query);
  res.json(properties);
});

/* =========================================
   GET HOST PROPERTIES
========================================= */
export const getHostProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ hostId: req.user._id });
  res.json(properties);
});

/* =========================================
   GET PROPERTY BY ID
========================================= */
export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "hostId",
    "name email"
  );

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  res.json(property);
});

/* =========================================
   DELETE PROPERTY
========================================= */
export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.hostId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await Property.findByIdAndDelete(req.params.id);

  res.json({ message: "Property removed" });
});

/* =========================================
   UPDATE PROPERTY (Cloudinary Fixed)
========================================= */
export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  if (property.hostId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const {
    title,
    type,
    bhkType,
    allowedMembers,
    pricePerMonth,
    perSeatPrice,
    fullHousePrice,
    minimumStay,
    maximumStay,
    city,
    location,
    nearbyPlace,
    distance,
    internStyle,
    kitchen,
    bathroom,
    toilet,
    electricityFree,
    waterFree,
    rules,
  } = req.body;

  // ✅ BASIC UPDATE
  property.title = title || property.title;
  property.type = type || property.type;
  property.ownerName = req.body.ownerName || property.ownerName || "";
  property.ownerEmail = req.body.ownerEmail || property.ownerEmail || "";

  const isRoom = (type || property.type) === "room";

  property.bhkType = isRoom ? undefined : bhkType || property.bhkType;
  property.internStyle =
    (type || property.type) === "intern"
      ? internStyle || property.internStyle
      : undefined;

  property.allowedMembers =
    Number(allowedMembers) || property.allowedMembers;

  property.perSeatPrice = perSeatPrice || property.perSeatPrice;
  property.fullHousePrice = fullHousePrice || property.fullHousePrice;
  property.pricePerMonth = pricePerMonth || property.pricePerMonth;
  property.minimumStay = minimumStay || property.minimumStay;
  property.maximumStay = maximumStay || property.maximumStay;

  property.city = city || property.city;
  property.location = location || property.location;
  property.nearbyPlace = nearbyPlace || property.nearbyPlace;
  property.distance = distance || property.distance;

  property.kitchen = kitchen || property.kitchen;
  property.bathroom = bathroom || property.bathroom;
  property.toilet = toilet || property.toilet;
  property.electricityFree =
    electricityFree || property.electricityFree;
  property.waterFree = waterFree || property.waterFree;
  property.rules = rules || property.rules;

  // ✅ CLOUDINARY IMAGE UPDATE
  if (req.files?.houseImage) {
    property.houseImage = req.files.houseImage[0].path;
  }

  if (req.files?.indoorImages) {
    property.indoorImages = req.files.indoorImages.map((f) => f.path);
  }

  if (req.files?.outdoorImages) {
    property.outdoorImages = req.files.outdoorImages.map((f) => f.path);
  }

  const updated = await property.save();
  res.json(updated);
});

/* =========================================
   COMBO LOGIC (NO CHANGE)
========================================= */
export const getComboByTypeAndSubType = asyncHandler(async (req, res) => {
  const { type, allowedFor } = req.query;

  const query = {
    status: "available",
    availableSeats: { $gt: 0 },
  };

  if (type) {
    if (type === "room") {
      query.$or = [{ type: "room" }, { type: "intern", internStyle: "room" }];
    } else if (type === "flat") {
      query.$or = [{ type: "flat" }, { type: "intern", internStyle: "flat" }];
    } else {
      query.type = type;
    }
  }

  if (allowedFor) query.allowedFor = allowedFor;

  const properties = await Property.find(query).lean();

  const propertyIds = properties.map((p) => p._id);

  const bookings = await Booking.find({
    propertyId: { $in: propertyIds },
    bookingStatus: { $in: ["accepted", "pending"] },
  })
    .populate("guestId", "name")
    .lean();

  const occupantsByProperty = {};

  bookings.forEach((booking) => {
    const leaveDate = new Date(booking.visitDate);
    leaveDate.setMonth(
      leaveDate.getMonth() + Number(booking.stayDuration || 0)
    );

    const key = booking.propertyId.toString();

    occupantsByProperty[key] = occupantsByProperty[key] || [];
    occupantsByProperty[key].push({
      leaveDate: leaveDate.toISOString().split("T")[0],
      guest: booking.guestId,
      seatsBooked: booking.seatsBooked,
      professionalInfo: booking.professionalInfo,
    });
  });

  const combos = properties
    .filter((p) => p.allowedMembers > p.availableSeats)
    .map((p) => ({
      ...p,
      occupants: occupantsByProperty[p._id.toString()] || [],
    }));

  res.json(combos);
});