const Casier = require('../schema/casier.schema');
const Reservation = require('../schema/reservation.schema');
const sendEmail = require('../utils/email.util');

const reserverCasier = async (req, res) => {
  try {
    const { casierId, dureeHeures } = req.body;
    const userId = req.query.userId;

    const casier = await Casier.findById(casierId);
    if (!casier || casier.statut !== 'disponible') {
      return res.status(400).json({ message: 'Ce casier est déjà réservé.' });
    }

    const prixTotal = casier.prix * dureeHeures;
    const dateExpiration = new Date(Date.now() + dureeHeures * 3600000);

    const reservation = await Reservation.create({
      userId,
      casierId,
      dateExpiration,
      prixTotal
    });

    casier.statut = 'réservé';
    await casier.save();

    await sendEmail({
      to: req.user.email,
      subject: 'Réservation confirmée',
      text: `Casier #${casier.numero} réservé pour ${dureeHeures}h jusqu'à ${dateExpiration}`
    });

    res.status(201).json({ message: 'Réservation réussie', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getReservationsByUserId = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const reservations = await Reservation.find({ userId }).populate('casierId');

    return res.status(200).json({ reservations: reservations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservationId = req.query.id;
    const reservation = await Reservation.findById(reservationId).populate('casierId');
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }
    return res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservationId = req.query.id;
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const casier = await Casier.findById(reservation.casierId);
    if (!casier) {
      console.error('Casier non trouvé');
      return res.status(404).json({ message: 'Casier non trouvé' });
    }
    casier.statut = 'disponible';
    await casier.save();
    await Reservation.deleteOne({ _id: reservationId });
    await sendEmail({
      to: reservation.userId,
      subject: 'Réservation annulée',
      text: `Votre réservation pour le casier #${casier.numero} a été annulée.`
    });
    return res.status(200).json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('userId casierId');
    return res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

const getReservationByCasierId = async (req, res) => {
  try {
    const casierId = req.query.casierId;
    const reservation = await Reservation
      .findOne({ casierId })
      .populate('userId casierId');
    
      return res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  reserverCasier,
  getReservationsByUserId,
  getReservationById,
  cancelReservation,
  getAllReservations,
  getReservationByCasierId
};