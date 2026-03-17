// import mongoose from "mongoose";

// const propertySchema = mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },

//     type: {
//       type: String,
//       enum: ["room", "flat", "intern"],
//       required: true,
//     },

//     bhkType: {
//       type: String,
//       enum: ["1BHK", "2BHK", "3BHK"],
//     },

//  allowedMembers: {
//   type: Number,
//   required: true,
//   min: 1,
//   default: 1 // always 1 if nothing is provided
// },

//     /* FIX: add this field */
//     availableSeats: {
//       type: Number,
//       default: 1,
//       min: 0,
//     },

//     pricePerMonth: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     minimumStay: {
//       type: Number,
//       required: true,
//       min: 1,
//     },

//     maximumStay: {
//       type: Number,
//       required: true,
//       min: 1,
//     },

//     city: {
//       type: String,
//       required: true,
//     },

//     location: {
//       type: String,
//       required: true,
//     },

//     nearbyPlace: String,

//     distance: String,

//     houseImage: String,

//     indoorImages: [String],

//     outdoorImages: [String],

//     images: [String],

//     internStyle: {
//       type: String,
//       enum: ["room", "flat"],
//     },

//     hostId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["available", "unavailable"],
//       default: "available",
//     },

//     /* HOUSE FACILITIES */

//     kitchen: {
//       type: String,
//       enum: ["shared", "private", "no"],
//     },

//     bathroom: {
//       type: String,
//       enum: ["shared", "private", "no"],
//     },

//     toilet: {
//       type: String,
//       enum: ["shared", "private", "no"],
//     },

//     electricityFree: {
//       type: String,
//       enum: ["yes", "no"],
//     },

//     waterFree: {
//       type: String,
//       enum: ["yes", "no"],
//     },

//     allowedFor: {
//       type: String,
//       enum: ["girls", "boys", "family", "anyone"],
//       default: "anyone",
//     },

//     rules: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// /* AUTO SEAT MANAGEMENT */

// propertySchema.pre("validate", function (next) {
//   // Ensure availableSeats defaults to allowedMembers
//   if (this.availableSeats == null) {
//     this.availableSeats = this.allowedMembers; 
//   }

//   // Make sure availableSeats never exceeds allowedMembers
//   if (this.allowedMembers != null && this.availableSeats > this.allowedMembers) {
//     this.availableSeats = this.allowedMembers;
//   }

//   // Intern stay restrictions
//   if (this.type === "intern") {
//     this.minimumStay = Math.max(this.minimumStay || 1, 1);
//     this.maximumStay = Math.min(this.maximumStay || 3, 3);
//   }

// });
// const Property = mongoose.model("Property", propertySchema);

// export default Property;

import mongoose from "mongoose";

const propertySchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["room", "flat", "intern"], required: true },
    bhkType: { type: String, enum: ["1BHK", "2BHK", "3BHK"] },
    allowedMembers: { type: Number, required: true, min: 1, default: 1 },
    availableSeats: { type: Number, default: 1, min: 0 },
    pricePerMonth: { type: Number, required: true, min: 0 },
    perSeatPrice: { type: Number, required: true, min: 0 },
    fullHousePrice: { type: Number, required: true, min: 0 },
    minimumStay: { type: Number, required: true, min: 1 },
    maximumStay: { type: Number, required: true, min: 1 },
    city: { type: String, required: true },
    location: { type: String, required: true },
    nearbyPlace: String,
    distance: String,
    houseImage: String,
    indoorImages: [String],
    outdoorImages: [String],
    images: [String],
    internStyle: { type: String, enum: ["room", "flat"] },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["available", "unavailable"], default: "available" },

    /* HOUSE FACILITIES */
    kitchen: { type: String, enum: ["shared", "private", "no"] },
    bathroom: { type: String, enum: ["shared", "private", "no"] },
    toilet: { type: String, enum: ["shared", "private", "no"] },
    electricityFree: { type: String, enum: ["yes", "no"] },
    waterFree: { type: String, enum: ["yes", "no"] },
    allowedFor: { type: String, enum: ["girls", "boys", "family", "anyone"], default: "anyone" },
    ownerName: { type: String, default: "" },
    ownerEmail: { type: String, default: "" },
    rules: String,
  },
  { timestamps: true }
);

/* AUTO SEAT MANAGEMENT */
propertySchema.pre("validate", function (next) {
  if (this.availableSeats == null) this.availableSeats = this.allowedMembers;

  // Price defaults
  if (this.perSeatPrice == null && this.fullHousePrice != null && this.allowedMembers > 0) {
    this.perSeatPrice = this.fullHousePrice / this.allowedMembers;
  } else if (this.fullHousePrice == null && this.perSeatPrice != null && this.allowedMembers > 0) {
    this.fullHousePrice = this.perSeatPrice * this.allowedMembers;
  }
  this.pricePerMonth = this.fullHousePrice || this.pricePerMonth;
  if (this.allowedMembers != null && this.availableSeats > this.allowedMembers) {
    this.availableSeats = this.allowedMembers;
  }

  if (this.type === "intern") {
    this.minimumStay = Math.max(this.minimumStay || 1, 1);
    this.maximumStay = Math.min(this.maximumStay || 3, 3);
  }

 
});

const Property = mongoose.model("Property", propertySchema);

export default Property;