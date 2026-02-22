const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMyBookings)
  .post(protect, createBooking);

router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
