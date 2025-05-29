const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  casierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Casier', required: true },
  dateDebut: { type: Date, default: Date.now },
  dateExpiration: { type: Date, required: true },
  prixTotal: { type: Number, required: true },
  statut: { type: String, enum: ['active', 'expired'], default: 'active' }
});

module.exports = mongoose.model('Reservation', reservationSchema);
