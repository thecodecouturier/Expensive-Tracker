const mongoose = require('mongoose');

// Define the Recurring Expense schema
const RecurringExpenseSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  frequency: { 
    type: String, 
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly'
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lastProcessed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RecurringExpense', RecurringExpenseSchema);
