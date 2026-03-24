const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin')); // Ultra sécurisé, seulement les admins

router.get('/dashboard', adminController.getDashboardData);
router.get('/users', adminController.getAllUsers);
router.get('/analytics/visitors', adminController.getVisitorAnalytics);
router.get('/analytics/feedbacks', adminController.getFeedbacks);
router.put('/analytics/feedbacks/:id', adminController.updateFeedbackStatus);
router.get('/subscribers', adminController.getSubscribers);

module.exports = router;
