// Import mongoose to access the Expense model
const mongoose = require('mongoose');
// Import the Expense Mongoose model
const Expense = mongoose.model('Expense');

// GET /api/expenses - Get all expenses for the logged-in user
const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/expenses - Add a new expense for the logged-in user
const addExpense = async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const expense = new Expense({ 
            description, 
            amount, 
            category, 
            date,
            userId: req.user.id  // Add userId from authenticated user
        });
        const saved = await expense.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// GET /api/expenses/:id - Get a single expense by ID (only if it belongs to the user)
const getExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
        if (expense) {
            res.json(expense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Invalid ID' });
    }
};

// DELETE /api/expenses/:id - Delete an expense by ID (only if it belongs to the user)
const deleteExpense = async (req, res) => {
    try {
        const deleted = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (deleted) {
            res.json({ message: 'Expense deleted' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Invalid ID' });
    }
};

// PUT /api/expenses/:id - Update an expense by ID (only if it belongs to the user)
const updateExpense = async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const updated = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { description, amount, category, date },
            { new: true, runValidators: true }
        );
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (err) {
        res.status(400).json({ message: 'Invalid data or ID' });
    }
};

// GET /api/expenses/report/:year/:month - Get monthly expense report for the logged-in user
const getMonthlyReport = async (req, res) => {
    const { year, month } = req.params;
    try {
        // Define the start and end dates for the report month
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        // Find expenses within the date range for the logged-in user
        const filtered = await Expense.find({
            userId: req.user.id,
            date: { $gte: start, $lt: end }
        });
        // Aggregate expenses by category
        const report = {};
        filtered.forEach(e => {
            const cat = e.category || 'Uncategorized';
            if (!report[cat]) report[cat] = 0;
            report[cat] += Number(e.amount) || 0;
        });
        // Get the budget amount from the database for this user and month
        let budget = 0;
        try {
            const budgetData = await mongoose.model('Budget').findOne({
                userId: req.user.id,
                month: parseInt(month),
                year: parseInt(year)
            });
            budget = budgetData ? budgetData.limit : 0;
        } catch (e) {
            console.error('Error fetching budget:', e);
            budget = 0;
        }
        // Send back the report data
        res.json({
            year: parseInt(year),
            month: parseInt(month),
            total: filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
            byCategory: report,
            count: filtered.length,
            budget
        });
    } catch (err) {
        res.status(400).json({ message: 'Invalid date or server error' });
    }
};

// Export all controller functions
module.exports = {
    getExpenses,
    addExpense,
    getExpense,
    deleteExpense,
    updateExpense,
    getMonthlyReport
};
