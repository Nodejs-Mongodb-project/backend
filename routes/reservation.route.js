const express = require('express');
const router = express.Router();

const {
        reserverCasier,
        getReservationsByUserId,
        getReservationById,
        cancelReservation,
        getAllReservations,
        getReservationByCasierId
    } = require('../controllers/reservation.controller');
const { verifyToken, verifyTokenAdmin } = require('../utils/auth.util');


router.get('/all', verifyTokenAdmin, getAllReservations); 
router.post('/reserver', verifyToken, reserverCasier);
router.get('/user/:userId', verifyToken, getReservationsByUserId);
router.get('/:reservationId', verifyToken, getReservationById);
router.delete('/:reservationId', verifyToken, cancelReservation);
router.get('/casier/:casierId', verifyToken, getReservationByCasierId);

module.exports = router;
