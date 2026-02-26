// Configuration
const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';

// State management
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
  setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
  // Auth tabs
  document.getElementById('loginTab').addEventListener('click', showLoginForm);
  document.getElementById('registerTab').addEventListener('click', showRegisterForm);

  // Auth forms
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Complaint form
  document.getElementById('complaintForm').addEventListener('submit', handleSubmitIssue);
  document.getElementById('getLocationBtn').addEventListener('click', getLocation);
}

// Auth UI functions
function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  const complaintSection = document.getElementById('complaintSection');
  const userInfo = document.getElementById('userInfo');
  const logoutBtn = document.getElementById('logoutBtn');

  if (authToken && currentUser) {
    authSection.style.display = 'none';
    complaintSection.style.display = 'block';
    userInfo.textContent = `Welcome, ${currentUser.email}`;
    logoutBtn.style.display = 'inline-block';
    loadIssues();
  } else {
    authSection.style.display = 'block';
    complaintSection.style.display = 'none';
    userInfo.textContent = '';
    logoutBtn.style.display = 'none';
  }
}

function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
}

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('registerTab').classList.add('active');
}

// Auth functions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Login failed');
    }

    const data = await response.json();
    authToken = data.tokens.accessToken;
    currentUser = data.user;

    // Store in localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Clear form
    document.getElementById('loginForm').reset();
    errorDiv.style.display = 'none';

    updateAuthUI();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const name = document.getElementById('registerName').value;
  const errorDiv = document.getElementById('registerError');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Registration failed');
    }

    const data = await response.json();
    authToken = data.tokens.accessToken;
    currentUser = data.user;

    // Store in localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Clear form
    document.getElementById('registerForm').reset();
    errorDiv.style.display = 'none';

    updateAuthUI();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  updateAuthUI();
  document.getElementById('registerForm').reset();
}

// Issue functions
async function handleSubmitIssue(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('complaintError');
  const successDiv = document.getElementById('complaintSuccess');

  try {
    const title = document.getElementById('issueTitle').value;
    const description = document.getElementById('issueDescription').value;
    const category = document.getElementById('issueCategory').value;
    const severity = document.getElementById('issueSeverity').value;
    const latitude = parseFloat(document.getElementById('issueLatitude').value);
    const longitude = parseFloat(document.getElementById('issueLongitude').value);
    const address = document.getElementById('issueAddress').value;

    const response = await fetch(`${API_BASE_URL}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        description,
        category,
        severity,
        latitude,
        longitude,
        address
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to submit issue');
    }

    const data = await response.json();
    errorDiv.style.display = 'none';
    successDiv.textContent = 'Issue submitted successfully!';
    successDiv.style.display = 'block';

    // Clear form
    document.getElementById('complaintForm').reset();

    // Reload issues
    loadIssues();

    // Hide success message after 3 seconds
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
  }
}

async function loadIssues() {
  try {
    const response = await fetch(`${API_BASE_URL}/issues?page=1&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load issues');
    }

    const data = await response.json();
    displayIssues(data.issues || data);
  } catch (error) {
    console.error('Error loading issues:', error);
    document.getElementById('issuesList').innerHTML = `<p class="text-danger">Error loading issues: ${error.message}</p>`;
  }
}

function displayIssues(issues) {
  const issuesList = document.getElementById('issuesList');
  issuesList.innerHTML = '';

  if (!Array.isArray(issues) || issues.length === 0) {
    issuesList.innerHTML = '<p class="col-12">No issues found.</p>';
    return;
  }

  issues.forEach(issue => {
    const issueCard = document.createElement('div');
    issueCard.className = 'col-md-4 mb-3';
    issueCard.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(issue.title)}</h5>
          <p class="card-text">${escapeHtml(issue.description)}</p>
          <div class="mb-2">
            <span class="badge bg-info">${issue.category}</span>
            <span class="badge bg-${getSeverityColor(issue.severity)}">${issue.severity}</span>
            <span class="badge bg-${getStatusColor(issue.status)}">${issue.status}</span>
          </div>
          <small class="text-muted">
            📍 Lat: ${issue.latitude}, Lon: ${issue.longitude}
          </small>
        </div>
        <div class="card-footer text-muted">
          <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
        </div>
      </div>
    `;
    issuesList.appendChild(issueCard);
  });
}

function getSeverityColor(severity) {
  const colors = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
  return colors[severity] || 'secondary';
}

function getStatusColor(status) {
  const colors = { PENDING: 'warning', APPROVED: 'info', REJECTED: 'danger', IN_PROGRESS: 'primary', RESOLVED: 'success' };
  return colors[status] || 'secondary';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        document.getElementById('issueLatitude').value = lat;
        document.getElementById('issueLongitude').value = lon;
        document.getElementById('locationInfo').textContent = `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      },
      error => {
        document.getElementById('locationInfo').textContent = `Error: ${error.message}`;
      }
    );
  } else {
    document.getElementById('locationInfo').textContent = 'Geolocation is not supported by your browser';
  }
}
