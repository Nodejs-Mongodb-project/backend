const Casier = require('../schema/casier.schema');
const Reservation = require('../schema/reservation.schema');
const sendEmail = require('../utils/email.util');

const reserverCasier = async (req, res) => {
  try {
    const { casierId, dureeHeures } = req.body;
    const userId = req.user._id;

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

const getReservationsByUserId = async (userId) => {
  try {
    const reservations = await Reservation.find({ userId }).populate('casierId');
    return reservations;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération des réservations');
  }
}

const getReservationById = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId).populate('casierId');
    return reservation;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération de la réservation');
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
      console.emailrror('Casier non trouvé');
    }
    casier.statut = 'disponible';
    await casier.save();
    await Reservation.deleteOne({ _id: reservationId });
    await sendEmail({
      to: reservation.userId,
      subject: 'Réservation annulée',
      text: `Votre réservation pour le casier #${casier.numero} a été annulée.`
    });
    return { message: 'Réservation annulée avec succès' };
  }
  catch (error) {
    console.error(error);
    throw new Error('Erreur lors de l\'annulation de la réservation');
  }
};

const getAllReservations = async () => {
  try {
    const reservations = await Reservation.find().populate('userId casierId');
    return reservations;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération des réservations');
  }
}

const getReservationByCasierId = async (casierId) => {
  try {
    const reservation = await Reservation
      .findOne({ casierId })
      .populate('userId casierId');
    return reservation;
  }
  catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération de la réservation');
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