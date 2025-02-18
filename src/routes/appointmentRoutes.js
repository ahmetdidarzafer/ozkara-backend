const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getAppointments,
  getUserAppointments,
  updateAppointment,
  deleteAppointment,
  getBookedDates,
  getBookedTimes
} = require('../controllers/appointmentController');

// Debug middleware
router.use((req, res, next) => {
  console.log('Appointment Route - Request:', {
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    body: req.body
  });
  next();
});

router.post('/', protect, createAppointment);
router.post('/guest', createAppointment);
router.get('/', protect, getAppointments);
router.get('/user', protect, getUserAppointments); // Kullanıcının kendi randevuları
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);
router.get('/booked-dates', getBookedDates);
router.get('/booked-times', getBookedTimes);

module.exports = router;
