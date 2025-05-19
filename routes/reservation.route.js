const express = require('express');
const router = express.Router();

const {
        reserverCasier,
        getReservationsByUserId,
        getReservationById,
        cancelReservation,
        getAllReservations,
        getReservationByCasierId
    } = require('../controller/reservation.controller');
const { verifyToken } = require('../utils/auth.util');

router.post('/reserver', verifyToken, reserverCasier);
router.get('/user/:userId', verifyToken, getReservationsByUserId);
router.get('/:reservationId', verifyToken, getReservationById);
router.delete('/:reservationId', verifyToken, cancelReservation);
router.get('/all', verifyToken, getAllReservations);
router.get('/casier/:casierId', verifyToken, getReservationByCasierId);

module.exports = router;
