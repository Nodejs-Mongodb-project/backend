const Casier = require('../schema/casier.schema');
const Reservation = require('../schema/reservation.schema');
const sendEmail = require('../utils/email.util');

const reserverCasier = async (req, res) => {
  try {
    const { casierId, dureeHeures } = req.body;
    const userId = req.user._id;

    const casier = await Casier.findById(casierId);
    if (!casier || casier.statut !== 'available') {
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

    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservationId = req.query.id;
    const reservation = await Reservation.findById(reservationId).populate('casierId');
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }
    res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la réservation' });
  }
};

const cancelReservation = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error('Réservation non trouvée');
    }

    const casier = await Casier.findById(reservation.casierId);
    if (!casier) {
      throw new Error('Casier non trouvé');
    }
    casier.statut = 'available';
    await casier.save();
    await Reservation.deleteOne({ _id: reservationId });
    await sendEmail({
      to: reservation.userId,
      subject: 'Réservation annulée',
      text: `Votre réservation pour le casier #${casier.numero} a été annulée.`
    });
    return { message: 'Réservation annulée avec succès' };
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de l\'annulation de la réservation');
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('userId casierId');
    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
};

const getReservationByCasierId = async (req, res) => {
  try {
    const casierId = req.query.casierId;
    const reservation = await Reservation
      .findOne({ casierId })
      .populate('userId casierId');
    
    res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la réservation' });
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
