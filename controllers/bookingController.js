import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/User.js";

export const createBooking = asyncHandler(async (req, res) => {
  const { propertyId, bookingType, stayDuration, visitDate, seatCount = 1, members = [], profession, workplace, age, passportPhoto } = req.body || {};
  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  if (property.type === "intern") {
    if (stayDuration < 1 || stayDuration > 3) {
      res.status(400);
      throw new Error("Intern rooms must be booked for 1 to 3 months");
    }
  }

  const seatsToBook = bookingType === "fullRoom" ? property.allowedMembers : seatCount;
  if (property.availableSeats < seatsToBook) {
    res.status(400);
    throw new Error(`Not enough seats available. Need ${seatsToBook}, available ${property.availableSeats}`);
  }
  property.availableSeats -= seatsToBook;
  property.markModified('availableSeats');

  const booking = await Booking.create({
    propertyId,
    guestId: req.user._id,
    hostId: property.hostId,
    bookingType,
    stayDuration,
    visitDate,
    seatsBooked: seatsToBook,
    members: Array.isArray(members) ? members.map(m => ({ name: m.name || '', professionalInfo: m.professionalInfo })) : [],
    professionalInfo: {
      profession,
      workplace,
      age: age ? Number(age) : undefined,
      passportPhoto,
    },
  });

  await property.save();

  // Host notification
  try {
    const propertyPop = await Property.findById(propertyId).populate('hostId', 'name email');
    const hostEmail = propertyPop.hostId.email;
    const emailText = `
New booking request!

Property: ${propertyPop.title}
Guest: ${req.user.name || req.user.email}
Seats: ${seatsToBook}
Stay: ${stayDuration} months from ${new Date(visitDate).toLocaleDateString()}
    `.trim();

    await sendEmail({
      to: hostEmail,
      subject: `🔔 New Booking Request: ${propertyPop.title}`,
      text: emailText,
    });
    console.log(`Host notification sent to ${hostEmail}`);
  } catch (error) {
    console.error('Host notification failed:', error.message);
  }

  res.status(201).json(booking);
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ guestId: req.user._id }).populate("propertyId", "title type city location pricePerMonth perSeatPrice fullHousePrice allowedMembers ownerName ownerEmail");
  res.json(bookings);
});

export const getHostBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ hostId: req.user._id })
    .populate("propertyId", "title type city location pricePerMonth perSeatPrice fullHousePrice allowedMembers ownerName ownerEmail")
    .populate("guestId", "name email phone")
    .populate("hostId", "name email");
  res.json(bookings);
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id).populate('propertyId', "title type city location pricePerMonth perSeatPrice fullHousePrice allowedMembers ownerName ownerEmail");
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (booking.hostId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (!["accepted", "rejected", "cancelled"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  // Restore seats on reject/cancel
  if (status === "rejected" || status === "cancelled") {
    const property = await Property.findById(booking.propertyId);
    if (property) {
      property.availableSeats = Math.min(
        property.availableSeats + booking.seatsBooked,
        property.allowedMembers
      );
      property.markModified('availableSeats');
      await property.save();
    }
  }

  booking.bookingStatus = status;
  await booking.save();

  // Emails for both accept/reject
  try {
    const guest = await User.findById(booking.guestId).select('name email');
    const property = booking.propertyId;
    
    if (status === 'accepted') {
      const seatPrice = property.perSeatPrice || property.pricePerMonth;
      const totalAmount = booking.seatsBooked * seatPrice;
      const receiptText = `
🎉 Booking ACCEPTED!

Property: ${property.title}
Seats: ${booking.seatsBooked}
Duration: ${booking.stayDuration} months
Amount: ₹${totalAmount}
Visit Date: ${new Date(booking.visitDate).toLocaleDateString()}
Dashboard: ${process.env.CLIENT_URL || 'http://localhost:5173'}/my-bookings
      `.trim();

      await sendEmail({
        to: guest.email,
        subject: `✅ Booking Confirmed - Receipt for ${property.title}`,
        text: receiptText,
      });
      console.log(`Receipt to guest ${guest.email}`);
    } else if (status === 'rejected') {
      const rejectText = `
❌ Booking rejected.

Property: ${property.title}
Dashboard: ${process.env.CLIENT_URL || 'http://localhost:5173'}/my-bookings
      `.trim();

      await sendEmail({
        to: guest.email,
        subject: `❌ Booking Rejected: ${property.title}`,
        text: rejectText,
      });
      console.log(`Rejection to guest ${guest.email}`);
    }
  } catch (emailError) {
    console.error('Status email failed:', emailError.message);
  }

  res.json(booking);
});

export const hostVerification = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  if (booking.hostId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (booking.bookingStatus !== 'accepted') {
    res.status(400);
    throw new Error("Booking must be accepted first");
  }

  const { guestName, address, pinCode, aadharNumber } = req.body;
  const verificationPhoto = req.file ? req.file.path : null;

  booking.hostVerification = {
    guestName,
    address,
    pinCode,
    aadharNumber,
    verificationPhoto,
    verifiedAt: new Date()
  };

  await booking.save();
  res.json({ message: 'Verification submitted successfully', booking });
});

export const sendReceiptEmail = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate([
    'propertyId',
    'guestId',
    'hostId'
  ]);

  if (!booking || booking.bookingStatus !== 'accepted') {
    res.status(400);
    throw new Error("Only accepted bookings");
  }

  if (booking.hostId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const property = booking.propertyId;
  const guest = booking.guestId;
  const fullRoomPrice = property.fullHousePrice || property.pricePerMonth || 0;
  const perSeatPrice = property.perSeatPrice || 0;
  const unitPrice = booking.bookingType === "fullRoom" ? fullRoomPrice : perSeatPrice;
  const quantity = booking.bookingType === "fullRoom" ? 1 : booking.seatsBooked || 1;
  const totalAmount = unitPrice * quantity * (booking.stayDuration || 1);
  const receiptNumber = booking._id.toString().slice(-6).toUpperCase();

  const htmlReceipt = `
<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: sans-serif; AscyncHandler = asyncHandler; }
</style>
</head>
<body>
<h1>Receipt #${receiptNumber}</h1>
<p>Property: ${property.title}</p>
<p>Total: ₹${totalAmount.toLocaleString()}</p>
</body>
</html>
  `;

  await sendEmail({
    to: guest.email,
    subject: `📄 Receipt #${receiptNumber}`,
    html: htmlReceipt,
  });

  res.json({ message: `Receipt sent to ${guest.email}` });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(['propertyId', 'guestId', 'hostId']);
  
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.guestId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (booking.bookingStatus === 'accepted') {
    res.status(400);
    throw new Error("Cannot cancel accepted bookings");
  }

  // Restore seats
  const property = booking.propertyId;
  property.availableSeats += booking.seatsBooked;
  property.availableSeats = Math.min(property.availableSeats, property.allowedMembers);
  property.markModified('availableSeats');
  await property.save();

  booking.bookingStatus = 'cancelled';
  await booking.save();

  // Host notification
  try {
    const hostEmail = booking.hostId.email;
    await sendEmail({
      to: hostEmail,
      subject: `ℹ️ Booking Cancelled by Guest: ${property.title}`,
      text: `Guest ${req.user.name} cancelled booking #${booking._id.slice(-6)}.`,
    });
    console.log(`Cancel notification to ${hostEmail}`);
  } catch (e) {
    console.error('Cancel email failed:', e.message);
  }

  res.json({ message: 'Booking cancelled successfully' });
});
