const {
    reserverCasier,
    cancelReservation
} = require('../../controllers/reservation.controller');

const Casier = require('../../schema/casier.schema');
const Reservation = require('../../schema/reservation.schema');
const sendEmail = require('../../utils/email.util');

jest.mock('../../schema/casier.schema');
jest.mock('../../schema/reservation.schema');
jest.mock('../../utils/email.util', () => jest.fn());

describe('ReservationController', () => {
    let req, res;
    
    beforeEach(() => {
        req = {
            body: {},
            user: { _id: 'user123', email: 'test@example.com' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        
        jest.clearAllMocks();
        // Mock la méthode console.error pour éviter les logs dans les tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('reserverCasier', () => {
        test('should reserve casier successfully', async () => {
            // Arrange
            req.body = { casierId: 'casier123', dureeHeures: 2 };
            
            const mockCasier = {
                _id: 'casier123',
                numero: 42,
                prix: 10,
                statut: 'available',
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
            expect(Casier.findById).toHaveBeenCalledWith('casier123');
            expect(Reservation.create).toHaveBeenCalledWith({
                userId: 'user123',
                casierId: 'casier123',
                dateExpiration: expect.any(Date),
                prixTotal: 20
            });
            expect(mockCasier.save).toHaveBeenCalled();
            expect(mockCasier.statut).toBe('réservé');
            expect(sendEmail).toHaveBeenCalledWith({
                to: 'test@example.com',
                subject: 'Réservation confirmée',
                text: expect.stringContaining('Casier #42 réservé pour 2h')
            });
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
                statut: 'réservé' // Déjà réservé
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
            const reservationId = 'reservation123';
            
            const mockReservation = {
                _id: 'reservation123',
                casierId: 'casier123',
                userId: 'user123'
            };
            
            const mockCasier = {
                _id: 'casier123',
                numero: 42,
                statut: 'réservé',
                save: jest.fn().mockResolvedValue()
            };
            
            Reservation.findById.mockResolvedValue(mockReservation);
            Casier.findById.mockResolvedValue(mockCasier);
            Reservation.deleteOne.mockResolvedValue();
            sendEmail.mockResolvedValue();
            
            // Act
            const result = await cancelReservation(reservationId);
            
            // Assert
            expect(Reservation.findById).toHaveBeenCalledWith('reservation123');
            expect(Casier.findById).toHaveBeenCalledWith('casier123');
            expect(mockCasier.statut).toBe('available');
            expect(mockCasier.save).toHaveBeenCalled();
            expect(Reservation.deleteOne).toHaveBeenCalledWith({ _id: 'reservation123' });
            expect(sendEmail).toHaveBeenCalledWith({
                to: 'user123',
                subject: 'Réservation annulée',
                text: expect.stringContaining('casier #42 a été annulée')
            });
            expect(result).toEqual({
                message: 'Réservation annulée avec succès'
            });
        });
        
        test('should throw error when reservation not found', async () => {
            // Arrange
            const reservationId = 'reservation999';
            
            Reservation.findById.mockResolvedValue(null);
            
            // Act & Assert
            await expect(cancelReservation(reservationId))
                .rejects
                .toThrow("Erreur lors de l'annulation de la réservation");
        });
        
        test('should handle errors in cancelReservation', async () => {
            // Arrange
            const reservationId = 'reservation123';
            
            Reservation.findById.mockRejectedValue(new Error('Database error'));
            
            // Act & Assert
            await expect(cancelReservation(reservationId))
                .rejects
                .toThrow('Erreur lors de l\'annulation de la réservation');
        });
    });
});