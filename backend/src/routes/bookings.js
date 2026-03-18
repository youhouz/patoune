const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.route('/')
  .get(protect, getMyBookings)
  .post(protect, createBooking);

router.put('/:id/status', protect, validateObjectId('id'), updateBookingStatus);

module.exports = router;
