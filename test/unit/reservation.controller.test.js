const {
    reserverCasier,
    cancelReservation
} = require('../../controllers/reservation.controller');

const Casier = require('../../schema/casier.schema');
const Reservation = require('../../schema/reservation.schema');
const { sendEmail } = require('../../utils/email.util');
const jwt = require('jsonwebtoken');

jest.mock('../../schema/casier.schema');
jest.mock('../../schema/reservation.schema');
jest.mock('../../utils/email.util', () => ({
    sendEmail: jest.fn()
}));
jest.mock('jsonwebtoken');

describe('ReservationController', () => {
    let req, res;
    
    beforeEach(() => {
        req = {
            body: {},
            headers: {
                authorization: 'Bearer valid-token'
            },
            user: { _id: 'user123', email: 'test@example.com' },
            params: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        
        jest.clearAllMocks();
        // Mock la méthode console.error pour éviter les logs dans les tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock JWT verification
        jwt.verify.mockReturnValue({
            id: 'user123',
            email: 'test@example.com'
        });
        
        // Mock process.env
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('reserverCasier', () => {
        test('should reserve casier successfully', async () => {
            // Arrange
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            
            const mockCasier = {
                _id: 'casier123',
                numero: 42,
                prix: 10,
                status: 'available',
                save: jest.fn().mockResolvedValue()
            };
            
            const mockReservation = {
                _id: 'reservation123',
                userId: 'user123',
                casierId: 'casier123',
                prixTotal: 20
            };
            
            Casier.findById.mockResolvedValue(mockCasier);
            Reservation.create.mockResolvedValue(mockReservation);
            sendEmail.mockResolvedValue();
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(Casier.findById).toHaveBeenCalledWith('casier123');
            expect(Reservation.create).toHaveBeenCalledWith({
                userId: 'user123',
                casierId: 'casier123',
                dateExpiration: expect.any(Date),
                prixTotal: 20
            });
            expect(mockCasier.save).toHaveBeenCalled();
            expect(mockCasier.status).toBe('reserved');
            expect(sendEmail).toHaveBeenCalledWith(
                'test@example.com',
                'Réservation confirmée',
                expect.stringContaining('Casier #42 réservé pour 2h')
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Réservation réussie',
                reservation: mockReservation
            });
        });
        
        test('should return error when casier is not available', async () => {
            // Arrange
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            
            const mockCasier = {
                _id: 'casier123',
                status: 'reserved' // Déjà réservé
            };
            
            Casier.findById.mockResolvedValue(mockCasier);
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ce casier est déjà réservé.'
            });
            expect(Reservation.create).not.toHaveBeenCalled();
        });
        
        test('should return error when casier not found', async () => {
            // Arrange
            req.body = { casierId: 'casier999', dureeHeures: 2 };
            
            Casier.findById.mockResolvedValue(null);
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ce casier est déjà réservé.'
            });
        });
        
        test('should return error when token is missing', async () => {
            // Arrange
            req.headers = {}; // No authorization header
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token manquant'
            });
        });
        
        test('should return error when token is invalid', async () => {
            // Arrange
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token invalide'
            });
        });
        
        test('should handle errors in reserverCasier', async () => {
            // Arrange
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            
            Casier.findById.mockRejectedValue(new Error('Database error'));
            
            // Act
            await reserverCasier(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erreur serveur'
            });
        });
    });

    describe('cancelReservation', () => {
        test('should cancel reservation successfully', async () => {
            // Arrange
            req.params.reservationId = 'reservation123';
            
            const mockReservation = {
                _id: 'reservation123',
                casierId: 'casier123',
                userId: 'user123'
            };
            
            const mockCasier = {
                _id: 'casier123',
                numero: 42,
                status: 'reserved',
                save: jest.fn().mockResolvedValue()
            };
            
            Reservation.findById.mockResolvedValue(mockReservation);
            Casier.findById.mockResolvedValue(mockCasier);
            Reservation.deleteOne.mockResolvedValue();
            sendEmail.mockResolvedValue();
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(Reservation.findById).toHaveBeenCalledWith('reservation123');
            expect(Casier.findById).toHaveBeenCalledWith('casier123');
            expect(mockCasier.status).toBe('available');
            expect(mockCasier.save).toHaveBeenCalled();
            expect(Reservation.deleteOne).toHaveBeenCalledWith({ _id: 'reservation123' });
            expect(sendEmail).toHaveBeenCalledWith(
                'user123',
                'Réservation annulée',
                expect.stringContaining('casier #42 a été annulée')
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Réservation annulée avec succès'
            });
        });
        
        test('should return error when reservationId is missing', async () => {
            // Arrange
            req.params.reservationId = undefined;
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'ID de réservation requis'
            });
        });
        
        test('should return error when reservation not found', async () => {
            // Arrange
            req.params.reservationId = 'reservation999';
            
            Reservation.findById.mockResolvedValue(null);
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Réservation non trouvée'
            });
        });
        
        test('should return error when casier not found', async () => {
            // Arrange
            req.params.reservationId = 'reservation123';
            
            const mockReservation = {
                _id: 'reservation123',
                casierId: 'casier999',
                userId: 'user123'
            };
            
            Reservation.findById.mockResolvedValue(mockReservation);
            Casier.findById.mockResolvedValue(null);
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Casier non trouvé'
            });
        });
        
        test('should handle database errors gracefully', async () => {
            // Arrange
            req.params.reservationId = 'reservation123';
            
            Reservation.findById.mockRejectedValue(new Error('Database error'));
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erreur serveur lors de l\'annulation'
            });
        });
        
        test('should continue if email sending fails', async () => {
            // Arrange
            req.params.reservationId = 'reservation123';
            
            const mockReservation = {
                _id: 'reservation123',
                casierId: 'casier123',
                userId: 'user123'
            };
            
            const mockCasier = {
                _id: 'casier123',
                numero: 42,
                status: 'reserved',
                save: jest.fn().mockResolvedValue()
            };
            
            Reservation.findById.mockResolvedValue(mockReservation);
            Casier.findById.mockResolvedValue(mockCasier);
            Reservation.deleteOne.mockResolvedValue();
            sendEmail.mockRejectedValue(new Error('Email service error'));
            
            // Act
            await cancelReservation(req, res);
            
            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Réservation annulée avec succès'
            });
        });
    });
});