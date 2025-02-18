const Appointment = require('../models/Appointment');

// Kullanıcının kendi randevularını getir
exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .sort({ date: -1 })
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Randevular yüklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Randevu oluştur
exports.createAppointment = async (req, res) => {
  try {
    const { date, time, service, notes, isGuest, guestInfo } = req.body;

    // Tarih ve saati doğru formatta ayarla
    const appointmentDate = new Date(date);
    const [hours, minutes] = time.split(':');
    appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    const appointmentData = {
      date: appointmentDate,
      time,
      service,
      notes,
      status: 'Beklemede'
    };

    // Eğer misafir kullanıcı ise guestInfo'yu ekle, değilse user'ı ekle
    if (isGuest) {
      appointmentData.isGuest = true;
      appointmentData.guestInfo = guestInfo;
    } else {
      appointmentData.user = req.user._id;
    }

    const appointment = await Appointment.create(appointmentData);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Tüm randevuları getir (admin için)
exports.getAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const appointments = await Appointment.find()
      .sort({ date: -1 })
      .populate('user', 'name email phone');

    const formattedAppointments = appointments.map(appointment => {
      // Eğer misafir randevusu ise
      if (appointment.isGuest && appointment.guestInfo) {
        return {
          _id: appointment._id,
          name: appointment.guestInfo.name,
          email: appointment.guestInfo.email,
          phone: appointment.guestInfo.phone,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          notes: appointment.notes,
          status: appointment.status,
          createdAt: appointment.createdAt,
          isGuest: true
        };
      }
      
      // Üye kullanıcı randevusu ise
      return {
        _id: appointment._id,
        name: appointment.user?.name || 'Silinmiş Kullanıcı',
        email: appointment.user?.email || 'Bilgi Yok',
        phone: appointment.user?.phone || 'Bilgi Yok',
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
        notes: appointment.notes,
        status: appointment.status,
        createdAt: appointment.createdAt,
        isGuest: false
      };
    });

    res.status(200).json({
      success: true,
      data: formattedAppointments
    });
  } catch (error) {
    console.error('Randevular getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevular yüklenirken bir hata oluştu'
    });
  }
};

// Randevu güncelle
exports.updateAppointment = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Status değerini kontrol et
    const validStatuses = ['Beklemede', 'Onaylandı', 'Tamamlandı'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Randevu durumu güncellendi'
    });
  } catch (error) {
    console.error('Randevu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu güncellenirken bir hata oluştu'
    });
  }
};

// Randevu sil
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla silindi'
    });
  } catch (error) {
    console.error('Randevu silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Dolu randevu tarihlerini getir
exports.getBookedDates = async (req, res) => {
  try {
    // Her saat için randevuları kontrol et
    const appointments = await Appointment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Sadece tüm saatleri dolu olan günleri işaretle (9'dan 18'e kadar 10 saat)
    const fullyBookedDates = appointments
      .filter(app => app.count >= 10) // Tüm saatler doluysa
      .map(app => {
        const date = new Date(app._id.year, app._id.month - 1, app._id.day);
        return date;
      });

    res.status(200).json({
      success: true,
      dates: fullyBookedDates
    });
  } catch (error) {
    console.error('Dolu tarihler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dolu tarihler yüklenirken bir hata oluştu'
    });
  }
};

// Seçilen tarihteki dolu saatleri getir
exports.getBookedTimes = async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = new Date(date);
    
    // Gün başlangıcı ve sonu için tarihi ayarla
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

    // Seçilen tarihteki randevuları bul
    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).select('time');

    const times = appointments.map(app => app.time);

    res.status(200).json({
      success: true,
      times
    });
  } catch (error) {
    console.error('Dolu saatler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dolu saatler yüklenirken bir hata oluştu'
    });
  }
};
