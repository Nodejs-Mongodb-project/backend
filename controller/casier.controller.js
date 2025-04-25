const Casier = require('../schema/casier.schema.js');

const getAllCasiers = async (req, res) => {
    try {
        const casiers = await Casier.find();
        res.json(casiers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getCasierById = async (req, res) => {
    try {
        const casier = await Casier.findById(req.params.id);
        if (!casier) {
            return res.status(404).json({ message: 'Casier not found' });
        }
        res.status(200).json(casier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getCasiersByStatus = async (req, res) => {
    try {
        const casiers = await Casier.find({ status: req.params.status });
        res.json(casiers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createCasier = async (req, res) => {
    try {
        const existingCasier = await Casier.findOne({ numero: req.body.numero });
        if (existingCasier) {
            return res.status(400).json({ 
                error: "Création impossible, un casier avec ce numéro existe déjà" 
            });
        }
        const newCasier = new Casier(req.body);
        const savedCasier = await newCasier.save();
        res.status(201).json(savedCasier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateCasier = async (req, res) => {
    try {
        if (req.body.numero) {
            const existingCasier = await Casier.findOne({ 
                numero: req.body.numero,
                _id: { $ne: req.params.id }
            });
            
            if (existingCasier) {
                return res.status(400).json({ 
                    error: "Modification impossible, un casier avec ce numéro existe déjà" 
                });
            }
        }
        
        const updatedCasier = await Casier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCasier) {
            return res.status(404).json({ message: 'Casier not found' });
        }
        res.status(200).json(updatedCasier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteCasier = async (req, res) => {
    try {
        const deletedCasier = await Casier.findByIdAndDelete(req.params.id);
        if (!deletedCasier) {
            return res.status(404).json({ message: 'Casier not found' });
        }
        res.status(200).json({ message: 'Casier deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllCasiers,
    getCasierById,
    getCasiersByStatus,
    createCasier,
    updateCasier,
    deleteCasier
};
