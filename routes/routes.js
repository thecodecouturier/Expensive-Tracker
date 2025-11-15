const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

// Import controller functions for expenses
const { getExpenses, addExpense, getExpense, deleteExpense, updateExpense, getMonthlyReport } = require('../controller/expenseController');
// Import the Budget model
const Budget = mongoose.model('Budget');

// Expense Routes (Protected)
const expenseRouter = express.Router();
expenseRouter.get('/report/:year/:month', protect, getMonthlyReport);
expenseRouter.route('/').get(protect, getExpenses).post(protect, addExpense);
expenseRouter.route('/:id').get(protect, getExpense).delete(protect, deleteExpense).put(protect, updateExpense);

// Budget Routes (Protected)
const budgetRouter = express.Router();
budgetRouter.get('/', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const budget = await Budget.findOne({ 
      userId: req.user.id,
      month: targetMonth,
      year: targetYear
    });
    res.json(budget || { limit: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

budgetRouter.post('/', protect, async (req, res) => {
  try {
    const { limit, month, year } = req.body;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    if (limit === undefined || typeof limit !== 'number' || limit < 0) {
      return res.status(400).json({ message: 'Budget limit (number) is required and must be non-negative.' });
    }

    let budget = await Budget.findOne({ 
      userId: req.user.id,
      month: targetMonth,
      year: targetYear
    });
    
    if (budget) {
      budget.limit = limit;
      await budget.save();
      res.status(200).json(budget);
    } else {
      budget = new Budget({ 
        limit, 
        month: targetMonth, 
        year: targetYear,
        userId: req.user.id
      });
      await budget.save();
      res.status(201).json(budget);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mount individual routers
router.use('/expenses', expenseRouter);
router.use('/budgets', budgetRouter);

module.exports = router; 