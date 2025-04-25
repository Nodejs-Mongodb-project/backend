import mongoose from 'mongoose';

const casierSchema = new mongoose.Schema({
    numero: { type: Number, required: true },
    taille: { type: String, required: true },
    status: { type: String, enum: ['disponible', 'reservé'], default: 'disponible' },
    prix: { type: Number, required: true },
});

export default mongoose.model('Casier', casierSchema);