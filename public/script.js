// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in, redirect to login if not
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Configuration constants and application state
    const API_BASE_URL = '/api/expenses';
    const CURRENCY = 'EGP';
    let state = {
        allExpenses: [], // Stores all fetched expenses
        filteredExpenses: [], // Stores filtered expenses
        summary: { budget: 0, total: 0, byCategory: {} }, // Stores monthly summary data
        charts: { trendChart: null, pieChart: null } // Store chart instances
    };
    
    // Get user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Helper function to make authenticated fetch requests
    const authFetch = (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        return fetch(url, { ...options, headers });
    };

    // Get references to key DOM elements
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalAmountEl = document.getElementById('total-amount');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const toastEl = document.getElementById('toast');
    const summaryMonthEl = document.getElementById('summary-month');
    const summaryYearEl = document.getElementById('summary-year');
    const donutFill = document.getElementById('donut-fill');
    const progressPercentageEl = document.getElementById('progress-percentage');
    const spentValueEl = document.getElementById('spent-value');
    const budgetValueDisplayEl = document.getElementById('budget-value-display');
    const budgetValueEl = document.getElementById('budget-value');
    const budgetInputForm = document.getElementById('budget-input-form');
    const budgetInput = document.getElementById('budget-input');
    const remainingValueEl = document.getElementById('remaining-value');
    const categoryChartEl = document.getElementById('category-chart');
    
    // Donut chart setup (circumference for stroke-dasharray)
    const circumference = 2 * Math.PI * 42; 
    donutFill.style.strokeDasharray = circumference;

    // Mapping categories to their respective Font Awesome icons
    const categoryIconMap = new Map([
        ['fas fa-utensils', ['food', 'grocer', 'restaurant', 'meal', 'طعام', 'أكل', 'مطعم']],
        ['fas fa-file-invoice-dollar', ['bill', 'utility', 'rent', 'فاتورة', 'كهرباء', 'ايجار']],
        ['fas fa-car', ['transport', 'taxi', 'uber', 'gas', 'fuel', 'مواصلات', 'بنزين']],
        ['fas fa-shopping-bag', ['shopping', 'clothes', 'mall', 'تسوق', 'ملابس']],
        ['fas fa-heartbeat', ['health', 'doctor', 'pharmacy', 'صحة', 'دكتور', 'صيدلية']],
        ['fas fa-film', ['entertainment', 'movie', 'cinema', 'game', 'ترفيه', 'سينما']],
        ['fas fa-plane', ['travel', 'flight', 'hotel', 'سفر', 'فندق']],
        ['fas fa-ellipsis-h', ['misc', 'other', 'متنوع', 'اخرى']]
    ]);
    // Function to get icon based on category keywords
    const getCategoryIcon = (category) => {
        const catLower = category.toLowerCase();
        for (const [icon, keywords] of categoryIconMap.entries()) {
            if (keywords.some(keyword => catLower.includes(keyword))) return icon;
        }
        return 'fas fa-dollar-sign'; // Default icon
    };

    // Displays a toast notification with a message and type (success/error)
    const showToast = (message, type = 'success') => {
        toastEl.textContent = message;
        toastEl.className = `toast show ${type}`;
        setTimeout(() => { toastEl.className = toastEl.className.replace('show', ''); }, 3000);
    };

    // Sets the loading state for a button (disables and shows spinner)
    const setLoadingState = (button, isLoading) => {
        const span = button.querySelector('span');
        button.disabled = isLoading;
        span.innerHTML = isLoading ? '<div class="spinner"></div>' : 'Add Expense';
    };

    // Renders the list of recent transactions (expenses)
    const renderTransactions = () => {
        expenseList.innerHTML = ''; // Clear existing list items
        const recentExpenses = state.filteredExpenses.slice(0, 15); // Show only recent 15 from filtered
        recentExpenses.forEach(expense => {
            const item = document.createElement('li');
            item.setAttribute('data-id', expense._id);
            item.innerHTML = `
                <div class="expense-info">
                    <i class="${getCategoryIcon(expense.category)} category-icon"></i>
                    <div class="description-group">
                        <span class="description">${expense.description}</span>
                        <span class="category">${expense.category}</span>
                    </div>
                </div>
                <div class="amount-group">
                    <span class="expense-amount">${expense.amount.toFixed(2)} ${CURRENCY}</span>
                    <button class="delete-btn" aria-label="Delete expense"><i class="fas fa-trash"></i></button>
                </div>`;
            expenseList.appendChild(item);
        });
        // Update total all-time expenses display (use all expenses, not filtered)
        const totalSpent = state.allExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        totalAmountEl.textContent = `${totalSpent.toFixed(2)} ${CURRENCY}`;
    };
    
    // Renders the monthly summary (donut chart, budget details, category breakdown)
    const renderSummary = () => {
        const { budget = 0, total: spent = 0, byCategory = {} } = state.summary;
        const remaining = budget - spent;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        // Update donut chart fill based on percentage spent
        const offset = circumference - (percentage / 100) * circumference;
        donutFill.style.strokeDashoffset = Math.max(0, offset);
        // Change donut color based on spending percentage
        donutFill.classList.remove('high', 'medium', 'low');
        if (percentage > 85) donutFill.classList.add('high');
        else if (percentage > 60) donutFill.classList.add('medium');
        else donutFill.classList.add('low');

        // Update text values for percentage, spent, budget, and remaining
        progressPercentageEl.textContent = `${Math.round(percentage)}%`;
        spentValueEl.textContent = `${spent.toFixed(2)}`;
        budgetValueEl.textContent = `${budget.toFixed(2)}`;
        remainingValueEl.textContent = `${remaining.toFixed(2)}`;
        remainingValueEl.classList.toggle('negative', remaining < 0); // Apply negative style if remaining is less than 0
        
        // Render category breakdown chart
        categoryChartEl.innerHTML = '';
        const sortedCategories = Object.entries(byCategory).sort(([,a],[,b]) => b - a); // Sort categories by amount
        const maxCategoryTotal = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;
        
        if (sortedCategories.length === 0) {
            categoryChartEl.innerHTML = '<li>No expenses for this period.</li>';
        } else {
            sortedCategories.forEach(([cat, amount]) => {
                const barWidth = maxCategoryTotal > 0 ? (amount / maxCategoryTotal) * 100 : 0;
                const item = document.createElement('li');
                item.className = 'chart-item';
                item.innerHTML = `
                    <span class="chart-label">${cat}</span>
                    <div class="chart-bar-container"><div class="chart-bar" style="width: ${barWidth}%;"></div></div>
                    <span class="chart-amount">${amount.toFixed(2)}</span>`;
                categoryChartEl.appendChild(item);
            });
        }
    };

    // Fetches all expenses from the API
    const fetchAllExpenses = async () => {
        try {
            const res = await authFetch(API_BASE_URL);
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch expenses.');
            state.allExpenses = (await res.json()).sort((a,b) => new Date(b.date) - new Date(a.date));
            state.filteredExpenses = [...state.allExpenses]; // Initialize filtered expenses
            renderTransactions();
            updateCategoryFilter(); // Update category dropdown
            renderCharts(); // Render charts
        } catch (err) { console.error(err); showToast(err.message, 'error'); } // Log and show error toast
    };
    
    // Fetches the monthly expense summary from the API
    const fetchSummary = async () => {
        const year = summaryYearEl.value;
        const month = summaryMonthEl.value;
        try {
            // Fetch expense summary
            const expenseRes = await authFetch(`${API_BASE_URL}/report/${year}/${month}`);
            if (expenseRes.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (!expenseRes.ok) throw new Error('No expense data for this period.');
            const expenseSummary = await expenseRes.json();

            // Fetch budget for this specific month/year
            const budgetRes = await authFetch(`/api/budgets?month=${month}&year=${year}`);
            if (!budgetRes.ok) throw new Error('Failed to fetch budget.');
            const budgetData = await budgetRes.json();
            
            state.summary = {
                budget: budgetData.limit || 0, // Use the 'limit' field from the fetched budget
                total: expenseSummary.total,
                byCategory: expenseSummary.byCategory
            };
        } catch (err) { 
            console.error(err);
            state.summary = { budget: 0, total: 0, byCategory: {} }; 
        } // Reset summary on error
        renderSummary();
        renderPieChart(); // Update pie chart when summary changes
    };

    // Handles adding a new expense via form submission
    const addExpense = async (e) => {
        e.preventDefault(); // Prevent default form submission
        const newExpense = {
            description: document.getElementById('description').value.trim(),
            amount: +document.getElementById('amount').value,
            category: document.getElementById('category').value.trim()
        };
        // Validate input fields
        if (!newExpense.description || !newExpense.amount || !newExpense.category) {
            return showToast('Please fill all fields', 'error');
        }
        setLoadingState(addExpenseBtn, true); // Show loading spinner
        try {
            const res = await authFetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(newExpense)
            });
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (!res.ok) throw new Error('Failed to add expense.');
            expenseForm.reset(); // Clear form fields
            showToast('Expense added!', 'success');
            // Refresh both transactions and summary after adding
            await Promise.all([fetchAllExpenses(), fetchSummary()]);
        } catch (err) { showToast(err.message, 'error'); } 
        finally { setLoadingState(addExpenseBtn, false); } // Hide loading spinner
    };

    // Handles deleting an expense by its ID
    const deleteExpense = async (id) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            if (!res.ok) throw new Error('Failed to delete expense.');
            showToast('Expense deleted.', 'success');
            // Refresh both transactions and summary after deleting
            await Promise.all([fetchAllExpenses(), fetchSummary()]);
        } catch (err) { showToast(err.message, 'error'); } // Show error toast
    };
    
    // Handles setting the budget amount
    const setBudget = async (newBudgetValue) => {
        const budget = parseFloat(newBudgetValue);
        if (isNaN(budget) || budget < 0) {
            return showToast('Budget amount must be a non-negative number.', 'error');
        }

        const year = summaryYearEl.value;
        const month = summaryMonthEl.value;

        try {
            const res = await authFetch('/api/budgets', {
                method: 'POST',
                body: JSON.stringify({ 
                    limit: budget,
                    month: parseInt(month),
                    year: parseInt(year)
                })
            });
            
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update budget.');
            }
            showToast('Budget updated!', 'success');
            fetchSummary(); // Re-fetch summary to reflect changes
        } catch (error) {
            showToast(error.message, 'error');
        }
    };
    
    // Initialization function: sets up initial UI and event listeners
    const init = () => {
        // Initialize Dark Mode
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        // Theme toggle handler
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
        
        // Display user name
        document.getElementById('user-name').textContent = `Welcome, ${user.name || 'User'}!`;
        
        // Logout button handler
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
        
        // Set current month and year for summary controls
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        summaryYearEl.value = currentYear;
        // Populate month dropdown
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        summaryMonthEl.innerHTML = months.map((month, i) => `<option value="${i+1}">${month}</option>`).join('');
        summaryMonthEl.value = currentMonth;
        
        // Event listener for adding expenses
        expenseForm.addEventListener('submit', addExpense);

        // Event listener for deleting expenses (event delegation)
        expenseList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn && confirm('Delete this expense?')) {
                deleteExpense(deleteBtn.closest('li').dataset.id);
            }
        });

        // Event listeners for changing month/year in summary
        [summaryMonthEl, summaryYearEl].forEach(el => el.addEventListener('change', fetchSummary));

        // Logic for editing budget value directly in the display
        let isEditingBudget = false;
        budgetValueEl.addEventListener('click', () => {
            if (isEditingBudget) return;
            isEditingBudget = true;
            budgetValueEl.style.display = 'none';
            budgetInputForm.style.display = 'inline-block';
            
            // Populate with current budget value if available
            budgetInput.value = state.summary.budget > 0 ? state.summary.budget : ''; 
            budgetInput.focus();
            budgetInput.select();
        });

        // Function to finalize budget editing
        const finishBudgetEdit = () => {
            if (!isEditingBudget) return;
            setBudget(budgetInput.value); // Call setBudget with single value
            budgetInputForm.style.display = 'none';
            budgetValueEl.style.display = 'inline';
            isEditingBudget = false;
        };

        // Event listeners for budget input form
        budgetInputForm.addEventListener('submit', (e) => { e.preventDefault(); finishBudgetEdit(); });
        budgetInput.addEventListener('blur', finishBudgetEdit);
        
        // Filter event listeners
        document.getElementById('apply-filters').addEventListener('click', applyFilters);
        document.getElementById('clear-filters').addEventListener('click', clearFilters);
        
        // Export event listeners
        document.getElementById('export-excel').addEventListener('click', exportToExcel);
        document.getElementById('export-pdf').addEventListener('click', exportToPDF);

        // Initial data fetching when the page loads
        fetchAllExpenses();
        fetchSummary();
    };
    
    // Helper function to update theme icon
    const updateThemeIcon = (theme) => {
        const icon = document.querySelector('#theme-toggle i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    };
    
    // ============================================
    // CHARTS FUNCTIONALITY
    // ============================================
    
    const renderCharts = () => {
        renderTrendChart();
        renderPieChart();
    };
    
    // Render Monthly Trend Chart
    const renderTrendChart = () => {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        // Get last 6 months data
        const monthsData = getLast6MonthsData();
        
        // Destroy existing chart
        if (state.charts.trendChart) {
            state.charts.trendChart.destroy();
        }
        
        // Get theme colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#E0E0E0' : '#2c3e50';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        state.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthsData.labels,
                datasets: [{
                    label: 'Expenses',
                    data: monthsData.expenses,
                    borderColor: '#BB86FC',
                    backgroundColor: 'rgba(187, 134, 252, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Budget',
                    data: monthsData.budgets,
                    borderColor: '#03DAC6',
                    backgroundColor: 'rgba(3, 218, 198, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    };
    
    // Render Category Pie Chart
    const renderPieChart = () => {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        const categoryData = state.summary.byCategory || {};
        const categories = Object.keys(categoryData);
        const values = Object.values(categoryData);
        
        if (categories.length === 0) {
            return;
        }
        
        // Destroy existing chart
        if (state.charts.pieChart) {
            state.charts.pieChart.destroy();
        }
        
        // Get theme colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#E0E0E0' : '#2c3e50';
        
        const colors = [
            '#BB86FC', '#03DAC6', '#CF6679', '#66CF98', '#FFD700',
            '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'
        ];
        
        state.charts.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: isDark ? '#121212' : '#f5f7fa'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, padding: 10 }
                    }
                }
            }
        });
    };
    
    // Get last 6 months expense data
    const getLast6MonthsData = () => {
        const months = [];
        const expenses = [];
        const budgets = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            const monthExpenses = state.allExpenses.filter(e => {
                const expDate = new Date(e.date);
                return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
            });
            const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            months.push(monthName);
            expenses.push(total);
            budgets.push(state.summary.budget); // Simplified - use current budget
        }
        
        return { labels: months, expenses, budgets };
    };
    
    // ============================================
    // FILTERS FUNCTIONALITY
    // ============================================
    
    const applyFilters = () => {
        const searchTerm = document.getElementById('search-filter').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const dateFrom = document.getElementById('date-from-filter').value;
        const dateTo = document.getElementById('date-to-filter').value;
        
        state.filteredExpenses = state.allExpenses.filter(expense => {
            // Search filter
            if (searchTerm && !expense.description.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Category filter
            if (categoryFilter && expense.category !== categoryFilter) {
                return false;
            }
            
            // Date range filter
            const expenseDate = new Date(expense.date);
            if (dateFrom && expenseDate < new Date(dateFrom)) {
                return false;
            }
            if (dateTo && expenseDate > new Date(dateTo + 'T23:59:59')) {
                return false;
            }
            
            return true;
        });
        
        renderTransactions();
        showToast(`Showing ${state.filteredExpenses.length} expenses`, 'success');
    };
    
    const clearFilters = () => {
        document.getElementById('search-filter').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('date-from-filter').value = '';
        document.getElementById('date-to-filter').value = '';
        state.filteredExpenses = [...state.allExpenses];
        renderTransactions();
        showToast('Filters cleared', 'success');
    };
    
    const updateCategoryFilter = () => {
        const categories = [...new Set(state.allExpenses.map(e => e.category))];
        const select = document.getElementById('category-filter');
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    };
    
    // ============================================
    // EXPORT FUNCTIONALITY
    // ============================================
    
    const exportToExcel = () => {
        if (state.filteredExpenses.length === 0) {
            return showToast('No data to export', 'error');
        }
        
        const data = state.filteredExpenses.map(e => ({
            Date: new Date(e.date).toLocaleDateString(),
            Description: e.description,
            Category: e.category,
            Amount: e.amount
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        
        const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel file downloaded!', 'success');
    };
    
    const exportToPDF = () => {
        if (state.filteredExpenses.length === 0) {
            return showToast('No data to export', 'error');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text('Expense Report', 14, 20);
        
        // Date
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // User info
        doc.text(`User: ${user.name}`, 14, 37);
        
        // Table
        const tableData = state.filteredExpenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.description,
            e.category,
            `${e.amount.toFixed(2)} ${CURRENCY}`
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9 }
        });
        
        // Summary
        const finalY = doc.lastAutoTable.finalY + 10;
        const total = state.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        doc.setFontSize(12);
        doc.text(`Total: ${total.toFixed(2)} ${CURRENCY}`, 14, finalY);
        
        const fileName = `expenses_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showToast('PDF file downloaded!', 'success');
    };

    // Call the initialization function
    init();
});