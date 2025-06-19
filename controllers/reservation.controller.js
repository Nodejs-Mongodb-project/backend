const Casier = require('../schema/casier.schema');
const Reservation = require('../schema/reservation.schema');
const { sendEmail } = require('../utils/email.util');
const jwt = require('jsonwebtoken');

const reserverCasier = async (req, res) => {
  try {
    const { casierId, dureeHeures } = req.body;
    const token = req.headers['Authorization']?.split(' ')[1] || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return res.status(401).json({ message: 'Token invalide' });
    }

    const userId = decodedToken.id;

    if (!casierId || !dureeHeures || !userId) {
      return res.status(400).json({ message: 'Casier ID, durée et User ID sont requis.' });
    }

    const casier = await Casier.findById(casierId);
    if (!casier || casier.status !== 'available') {
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

    casier.status = 'reserved';
    await casier.save();

    await sendEmail(
      decodedToken.email,
      'Réservation confirmée',
      `Casier #${casier.numero} réservé pour ${dureeHeures}h jusqu'à ${dateExpiration}`
    );

    res.status(201).json({ message: 'Réservation réussie', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getReservationsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const reservations = await Reservation.find({ userId }).populate('casierId');

    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving reservations' });
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

const cancelReservation = async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    
    if (!reservationId) {
      return res.status(400).json({ message: 'ID de réservation requis' });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const casier = await Casier.findById(reservation.casierId);
    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé' });
    }
    
    casier.status = 'available';
    await casier.save();
    await Reservation.deleteOne({ _id: reservationId });
    
    try {
      await sendEmail(
        reservation.userId,
        'Réservation annulée',
        `Votre réservation pour le casier #${casier.numero} a été annulée.`
      );
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Continue even if email fails
    }
    
    res.status(200).json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'annulation' });
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
