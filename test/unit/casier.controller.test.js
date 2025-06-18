const {
    getAllCasiers,
    getCasierById,
    createCasier,
    getCasiersByStatus,
    updateCasier,
    deleteCasier
} = require('../../controllers/casier.controller');

// Mock du modèle Casier
const Casier = require('../../schema/casier.schema');
jest.mock('../../schema/casier.schema');

describe('CasierController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        jest.clearAllMocks();
    });

    describe('getAllCasiers', () => {
        test('should return all casiers', async () => {
            // Arrange : définir ce que le mock doit retourner
            const mockCasiers = [
                { _id: '1', numero: 123, taille: 'M', status: 'available' },
                { _id: '2', numero: 124, taille: 'L', status: 'reserved' }
            ];
            Casier.find.mockResolvedValue(mockCasiers);

            // Act : appeler la fonction
            await getAllCasiers(req, res);

            // Assert : vérifier le comportement
            expect(Casier.find).toHaveBeenCalledWith();
            expect(res.json).toHaveBeenCalledWith(mockCasiers);
        });

        test('should handle errors', async () => {
            // Arrange : faire échouer le mock
            Casier.find.mockRejectedValue(new Error('Database error'));

            // Act
            await getAllCasiers(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('getCasierById', () => {
        test('should return casier when found', async () => {
            // Arrange
            const mockCasier = { _id: '1', numero: 123, taille: 'M' };
            req.params.id = '1';
            Casier.findById.mockResolvedValue(mockCasier);

            // Act
            await getCasierById(req, res);

            // Assert
            expect(Casier.findById).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockCasier);
        });

        test('should return 404 when casier not found', async () => {
            // Arrange
            req.params.id = '999';
            Casier.findById.mockResolvedValue(null);

            // Act
            await getCasierById(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Casier not found' });
        });

        test('should handle errors in getCasierById', async () => {
            // Arrange
            req.params.id = '1';
            Casier.findById.mockRejectedValue(new Error('Database connection failed'));

            // Act
            await getCasierById(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database connection failed' });
        });
    });

    describe('createCasier', () => {
        test('should create casier when numero is unique', async () => {
            // Arrange
            req.body = { numero: 125, taille: 'M', prix: 50 };
            const savedCasier = { _id: '3', ...req.body, status: 'available' };

            Casier.findOne.mockResolvedValue(null); // Pas de casier existant
            Casier.prototype.save = jest.fn().mockResolvedValue(savedCasier);

            // Act
            await createCasier(req, res);

            // Assert
            expect(Casier.findOne).toHaveBeenCalledWith({ numero: 125 });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(savedCasier);
        });

        test('should return error when numero already exists', async () => {
            // Arrange
            req.body = { numero: 123, taille: 'M', prix: 50 };
            Casier.findOne.mockResolvedValue({ _id: '1', numero: 123 }); // Casier existant

            // Act
            await createCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Création impossible, un casier avec ce numéro existe déjà"
            });
        });

        test('should handle errors in createCasier', async () => {
            // Arrange
            req.body = { numero: 125, taille: 'M', prix: 50 };
            Casier.findOne.mockRejectedValue(new Error('Database timeout'));

            // Act
            await createCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database timeout' });
        });
    });

    describe('getCasiersByStatus', () => {
        test('should return casiers with specific status', async () => {
            // Arrange
            const mockCasiers = [
                { _id: '1', numero: 123, status: 'available' },
                { _id: '2', numero: 124, status: 'available' }
            ];
            req.params.status = 'available';
            Casier.find.mockResolvedValue(mockCasiers);

            // Act
            await getCasiersByStatus(req, res);

            // Assert
            expect(Casier.find).toHaveBeenCalledWith({ status: 'available' });
            expect(res.json).toHaveBeenCalledWith(mockCasiers);
        });

        test('should handle errors in getCasiersByStatus', async () => {
            // Arrange
            req.params.status = 'reserved';
            Casier.find.mockRejectedValue(new Error('Database error'));

            // Act
            await getCasiersByStatus(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('updateCasier', () => {
        test('should update casier successfully', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { taille: 'L', prix: 75 }; // Pas de numero dans body
            const updatedCasier = { _id: '1', numero: 123, taille: 'L', prix: 75 };

            Casier.findByIdAndUpdate.mockResolvedValue(updatedCasier);

            // Act
            await updateCasier(req, res);

            // Assert
            expect(Casier.findByIdAndUpdate).toHaveBeenCalledWith('1', req.body, { new: true });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedCasier);
        });

        test('should update casier with unique numero', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { numero: 999, taille: 'L' };
            const updatedCasier = { _id: '1', numero: 999, taille: 'L' };

            Casier.findOne.mockResolvedValue(null); // Aucun autre casier avec ce numero
            Casier.findByIdAndUpdate.mockResolvedValue(updatedCasier);

            // Act
            await updateCasier(req, res);

            // Assert
            expect(Casier.findOne).toHaveBeenCalledWith({
                numero: 999,
                _id: { $ne: '1' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedCasier);
        });

        test('should return error when updating with existing numero', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { numero: 123 };

            Casier.findOne.mockResolvedValue({ _id: '2', numero: 123 }); // Autre casier avec ce numero

            // Act
            await updateCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Modification impossible, un casier avec ce numéro existe déjà"
            });
        });

        test('should return 404 when casier to update not found', async () => {
            // Arrange
            req.params.id = '999';
            req.body = { taille: 'L' };

            Casier.findByIdAndUpdate.mockResolvedValue(null);

            // Act
            await updateCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Casier not found' });
        });

        test('should handle errors in updateCasier', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { taille: 'L' };

            Casier.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            // Act
            await updateCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('deleteCasier', () => {
        test('should delete casier successfully', async () => {
            // Arrange
            req.params.id = '1';
            const deletedCasier = { _id: '1', numero: 123, taille: 'M' };

            Casier.findByIdAndDelete.mockResolvedValue(deletedCasier);

            // Act
            await deleteCasier(req, res);

            // Assert
            expect(Casier.findByIdAndDelete).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Casier deleted successfully' });
        });

        test('should return 404 when casier to delete not found', async () => {
            // Arrange
            req.params.id = '999';

            Casier.findByIdAndDelete.mockResolvedValue(null);

            // Act
            await deleteCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Casier not found' });
        });

        test('should handle errors in deleteCasier', async () => {
            // Arrange
            req.params.id = '1';

            Casier.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            // Act
            await deleteCasier(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});