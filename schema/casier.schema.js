const mongoose = require('mongoose');

const casierSchema = new mongoose.Schema({
    numero: { type: Number, required: true },
    taille: { type: String, required: true },
    status: { type: String, enum: ['disponible', 'reservé'], default: 'disponible' },
    prix: { type: Number, required: true },
});


module.exports = mongoose.model('Casier', casierSchema);