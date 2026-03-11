const User = require('../models/User');
const Pet = require('../models/Pet');
const PetSitter = require('../models/PetSitter');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

exports.getDashboardData = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPets = await Pet.countDocuments();
    const totalPetSitters = await PetSitter.countDocuments();
    const totalScans = await Product.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Stats des 30 derniers jours (simplifié)
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          pets: totalPets,
          petSitters: totalPetSitters,
          scans: totalScans,
          bookings: totalBookings
        },
        analytics: {
          recentUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
