# CCIRS Frontend

Frontend client for the Crowdsourced Civic Issue Reporting System API.

## Setup

```bash
# Open index.html in a local web server
# For example using Python:
python -m http.server 8000

# Or using Node http-server:
npm install -g http-server
http-server
```

## Files
- `index.html` - Main page
- `app.js` - Application logic
- `styles.css` - Styling

## Configuration

Edit `app.js` to set API endpoint:

```javascript
const API_BASE_URL = 'http://localhost:3000';
```

## API Integration

The frontend connects to the backend API at the configured `API_BASE_URL`. Make sure the backend is running before starting the frontend.
