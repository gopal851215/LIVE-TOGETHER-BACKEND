import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["fullRoom", "seat"],
      required: true,
    },
    stayDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    members: [{
      name: { type: String },
      professionalInfo: {
        profession: { type: String },
        workplace: { type: String },
        age: { type: Number, min: 16 },
        passportPhoto: { type: String }
      }
    }],
    professionalInfo: {
      profession: { type: String },
      workplace: { type: String },
      age: { type: Number, min: 16 },
      passportPhoto: { type: String },
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    hostVerification: {
      guestName: String,
      address: String,
      pinCode: String,
      aadharNumber: String,
      verificationPhoto: String,
      verifiedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
