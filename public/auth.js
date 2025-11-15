// Authentication helper functions

// Show toast notification
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.className = toastEl.className.replace('show', '');
    }, 3000);
}

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Get user info
function getUserInfo() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout user
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Redirect to login if not authenticated (for protected pages)
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect to dashboard if already authenticated (for login/register pages)
function redirectIfAuthenticated() {
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return true;
    }
    return false;
}
