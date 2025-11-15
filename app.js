// Import required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Custom logger middleware
const logger = require('./middleware/logger');

// Initialize the Express app
const app = express();

// Enable CORS for all origins (or specify your Netlify domain)
app.use(cors());

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/expense-tracker';
// Connect to MongoDB
mongoose.connect(mongoURI).then(() => {
	console.log('MongoDB connected');
}).catch(err => {
	console.error('MongoDB connection error:', err);
});

// Define the schema for an Expense document
const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true }, // Description of the expense
  amount: { type: Number, required: true },     // Amount of the expense
  category: { type: String, required: true },   // Category of the expense
  date: { type: Date, default: Date.now },      // Date of the expense (defaults to now)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
});

// Register the Expense model with Mongoose
const Expense = mongoose.model('Expense', ExpenseSchema);

// Define the schema for a Budget document (single monthly limit)
const BudgetSchema = new mongoose.Schema({
  limit: { type: Number, required: true },     // Monthly budget limit
  month: { type: Number, required: true, min: 1, max: 12 },  // Month (1-12)
  year: { type: Number, required: true },      // Year
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
});

// Create compound index for userId, month, year (one budget per user per month)
BudgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Register the Budget model with Mongoose
const Budget = mongoose.model('Budget', BudgetSchema);

// Import User model
const User = require('./models/User');

// Import routes
const apiRoutes = require('./routes/routes');
const authRoutes = require('./routes/authRoutes');

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom logger middleware
app.use(logger);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use auth routes
app.use('/api/auth', authRoutes);

// Use expense routes for API endpoints
app.use('/api', apiRoutes);

// Define the port for the server to listen on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => console.log(`Server started on port http://localhost:${PORT}`));
