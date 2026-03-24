const User = require('../models/User');
const Pet = require('../models/Pet');
const PetSitter = require('../models/PetSitter');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const ScanHistory = require('../models/ScanHistory');
const Message = require('../models/Message');
const VisitorLog = require('../models/VisitorLog');
const Feedback = require('../models/Feedback');
const PreLaunchSubscriber = require('../models/PreLaunchSubscriber');

// ─── Helper: build date ranges ───────────────────────────────────────────────
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
exports.getDashboardData = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPets,
      totalPetSitters,
      totalProducts,
      totalBookings,
      totalScans,
      totalMessages,
      totalSubscribers,
      totalFeedbacks,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      scansToday,
      scansThisWeek,
      bookingsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Pet.countDocuments(),
      PetSitter.countDocuments(),
      Product.countDocuments(),
      Booking.countDocuments(),
      ScanHistory.countDocuments(),
      Message.countDocuments(),
      PreLaunchSubscriber.countDocuments(),
      Feedback.countDocuments({ status: 'new' }),
      User.countDocuments({ createdAt: { $gte: daysAgo(1) } }),
      User.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
      User.countDocuments({ createdAt: { $gte: daysAgo(30) } }),
      ScanHistory.countDocuments({ scannedAt: { $gte: daysAgo(1) } }),
      ScanHistory.countDocuments({ scannedAt: { $gte: daysAgo(7) } }),
      Booking.countDocuments({ createdAt: { $gte: daysAgo(30) } }),
    ]);

    // User registration trend (last 30 days, grouped by day)
    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: daysAgo(30) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Users by city (top 10)
    const usersByCity = await User.aggregate([
      { $match: { 'address.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Booking status breakdown
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          pets: totalPets,
          petSitters: totalPetSitters,
          products: totalProducts,
          bookings: totalBookings,
          scans: totalScans,
          messages: totalMessages,
          subscribers: totalSubscribers,
          newFeedbacks: totalFeedbacks,
        },
        growth: {
          usersToday,
          usersThisWeek,
          usersThisMonth,
          scansToday,
          scansThisWeek,
          bookingsThisMonth,
        },
        charts: {
          registrationTrend,
          usersByRole,
          usersByCity,
          bookingsByStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/analytics/visitors ────────────────────────────────────────
exports.getVisitorAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = daysAgo(days);

    const [
      totalRequests,
      uniqueIps,
      requestsByDevice,
      topPaths,
      requestsTrend,
      topIps,
      recentVisitors,
    ] = await Promise.all([
      // Total requests
      VisitorLog.countDocuments({ createdAt: { $gte: since } }),

      // Unique IPs
      VisitorLog.distinct('ip', { createdAt: { $gte: since } }).then((ips) => ips.length),

      // By device
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top paths (endpoints)
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', count: { $sum: 1 }, avgDuration: { $avg: '$duration' } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Requests per day
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            uniqueIps: { $addToSet: '$ip' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            uniqueVisitors: { $size: '$uniqueIps' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top IPs
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$ip',
            count: { $sum: 1 },
            lastSeen: { $max: '$createdAt' },
            devices: { $addToSet: '$device' },
            paths: { $addToSet: '$path' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Recent unique visitors (last 50)
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$ip',
            lastSeen: { $first: '$createdAt' },
            device: { $first: '$device' },
            userAgent: { $first: '$userAgent' },
            path: { $first: '$path' },
            user: { $first: '$user' },
            requestCount: { $sum: 1 },
          },
        },
        { $sort: { lastSeen: -1 } },
        { $limit: 50 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRequests,
          uniqueIps,
          period: `${days} derniers jours`,
        },
        requestsByDevice,
        topPaths,
        requestsTrend,
        topIps,
        recentVisitors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/analytics/feedbacks ───────────────────────────────────────
exports.getFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/analytics/feedbacks/:id ───────────────────────────────────
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback non trouve' });
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/subscribers ───────────────────────────────────────────────
exports.getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await PreLaunchSubscriber.find().sort({ createdAt: -1 });

    const byType = await PreLaunchSubscriber.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } },
    ]);

    const byCity = await PreLaunchSubscriber.aggregate([
      { $match: { city: { $exists: true, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
      byType,
      byCity,
    });
  } catch (error) {
    next(error);
  }
};
