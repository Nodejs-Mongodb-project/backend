const Casier = require('../schema/casier.schema');
const Reservation = require('../schema/reservation.schema');
const sendEmail = require('../utils/email.util');

exports.reserverCasier = async (req, res) => {
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
