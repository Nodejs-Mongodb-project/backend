const mongoose = require('mongoose');

const casierSchema = new mongoose.Schema({
    numero: { type: Number, required: true, increase: true, unique: true },
    taille: { type: String, enum: ['small', 'medium', 'large'], required: true },
    status: { type: String, enum: ['available', 'reserved', 'occupied', 'maintenance'], default: 'available' },
    prix: { type: Number, required: true },
});


module.exports = mongoose.model('Casier', casierSchema);