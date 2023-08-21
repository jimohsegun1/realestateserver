import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

// Create a user
export const createUser = asyncHandler(async (req, res) => {
  console.log("creating a user");

  let { email } = req.body;
  // Check if the user already exists
  const userExists = await prisma.user.findUnique({ where: { email: email } });
  if (!userExists) {
    // If user does not exist, create a new user
    const user = await prisma.user.create({ data: req.body });
    res.send({
      message: "User registered successfully",
      user: user,
    });
  } else {
    // If user already exists, send a response indicating that
    res.status(201).send({ message: "User already registered" });
  }
});

// Function to book a visit to a residency
export const bookVisit = asyncHandler(async (req, res) => {
  const { email, date } = req.body;
  const { id } = req.params;

  try {
    // Check if the user has already booked this residency
    const alreadyBooked = await prisma.user.findUnique({
      where: { email },
      select: { bookedVisits: true },
    });

    if (alreadyBooked.bookedVisits.some((visit) => visit.id === id)) {
      // If user has already booked, send an error response
      res.status(400).json({ message: "This residency is already booked by you" });
    } else {
      // If not already booked, update user's bookedVisits array
      await prisma.user.update({
        where: { email: email },
        data: {
          bookedVisits: { push: { id, date } },
        },
      });
      res.send("Your visit is booked successfully");
    }
  } catch (err) {
    throw new Error(err.message);
  }
});

// Function to get all bookings of a user
export const getAllBookings = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    // Retrieve all booked visits for a user
    const bookings = await prisma.user.findUnique({
      where: { email },
      select: { bookedVisits: true },
    });
    res.status(200).send(bookings);
  } catch (err) {
    throw new Error(err.message);
  }
});

// Function to cancel a booking
export const cancelBooking = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;
  try {
    // Find the user and their booked visits
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { bookedVisits: true },
    });

    // Find the index of the booking to cancel
    const index = user.bookedVisits.findIndex((visit) => visit.id === id);

    if (index === -1) {
      // If booking not found, send an error response
      res.status(404).json({ message: "Booking not found" });
    } else {
      // If booking found, remove it from the user's bookedVisits array
      user.bookedVisits.splice(index, 1);
      await prisma.user.update({
        where: { email },
        data: {
          bookedVisits: user.bookedVisits,
        },
      });

      res.send("Booking cancelled successfully");
    }
  } catch (err) {
    throw new Error(err.message);
  }
});

// Function to add/remove a residency to/from a user's favorites list
export const toFav = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { rid } = req.params;

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user.favResidenciesID.includes(rid)) {
      // If residency is already in favorites, remove it
      const updateUser = await prisma.user.update({
        where: { email },
        data: {
          favResidenciesID: {
            set: user.favResidenciesID.filter((id) => id !== rid),
          },
        },
      });

      res.send({ message: "Removed from favorites", user: updateUser });
    } else {
      // If residency is not in favorites, add it
      const updateUser = await prisma.user.update({
        where: { email },
        data: {
          favResidenciesID: {
            push: rid,
          },
        },
      });
      res.send({ message: "Updated favorites", user: updateUser });
    }
  } catch (err) {
    throw new Error(err.message);
  }
});

// Function to get all favorite residencies of a user
export const getAllFavorites = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    // Retrieve all favorite residencies for a user
    const favResd = await prisma.user.findUnique({
      where: { email },
      select: { favResidenciesID: true },
    });
    res.status(200).send(favResd);
  } catch (err) {
    throw new Error(err.message);
  }
});
