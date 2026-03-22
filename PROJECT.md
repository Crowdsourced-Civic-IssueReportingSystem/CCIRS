# CCIRS - Crowdsourced Civic Issue Reporting System

A full-stack web application for reporting and managing civic issues in your community.

## 📂 Project Structure

```
CCIRS/
├── backend/             # TypeScript/Express API (main backend)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # Web UI (HTML/CSS/JS)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── README.md
│
└── README.md           # This file
```

## 🚀 Quick Start

### Backend (TypeScript/Express API)

Navigate to the backend directory:

```bash
cd .
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

API runs at: `http://localhost:3000`

**Key endpoints:**
- `POST /auth/register` - Register account
- `POST /auth/login` - Login
- `POST /issues` - Create issue (auth required)
- `GET /issues` - List issues
- `GET /issues/:id` - Issue details

### Frontend (HTML/CSS/JavaScript)

Open in a local web server:

```bash
cd frontend
# Using Python 3:
python -m http.server 8000

# Or using Node http-server:
npx http-server
```

Access at: `http://localhost:8000` (or `http://localhost:5500` if using Live Server)

**Configure API endpoint** in `frontend/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

## 🔐 Authentication

- Register with email/password
- Login to get JWT tokens
- Token stored in browser localStorage
- Protected API routes require Bearer token in Authorization header

## 📊 Features

### Users Can
- ✅ Register & login
- ✅ Report civic issues with location (lat/lon)
- ✅ View all reported issues
- ✅ Comment on issues
- ✅ Upvote/downvote issues
- ✅ Auto-detect location using geolocation

### Issues Include
- Title, description, category
- Severity (LOW, MEDIUM, HIGH)
- Status (PENDING, APPROVED, REJECTED, IN_PROGRESS, RESOLVED)
- Geographic coordinates (latitude/longitude)
- Optional address
- Media attachments
- Timestamps

## 🗄️ Database

- **Development**: SQLite (`dev.db`)
- **Production**: PostgreSQL (configure in `.env`)

See [Backend README](./README.md) for database details.

## 🛠️ Tech Stack

**Backend:**
- TypeScript
- Express.js
- Prisma ORM
- SQLite / PostgreSQL
- JWT authentication
- Zod validation

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5
- Geolocation API

## 📝 Environment Setup

### Backend `.env`
```env
DATABASE_URL=file:./dev.db
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3000
CORS_ORIGIN=http://localhost:8000
```

### Frontend Configuration
Edit `frontend/app.js` line ~1:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

## 🔄 Data Flow

1. **User Registration/Login** → Backend validates → JWT tokens returned
2. **Issue Creation** → Frontend sends auth token → Backend validates & stores
3. **Issue Listing** → Frontend fetches from API → Displays with filters
4. **Comments & Votes** → Real-time updates via API

## 🚢 Deployment

### Backend Deployment
Push to hosting platform (Azure, Heroku, etc.):
```bash
npm run build
npm run start
```

### Frontend Deployment
Deploy to static hosting (GitHub Pages, Netlify, etc.):
- Update `API_BASE_URL` to production backend URL
- Deploy `frontend/` folder

## 📚 API Documentation

Full API documentation available in [Backend README](./README.md)

### Key Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ❌ | Register user |
| POST | /auth/login | ❌ | Login user |
| GET | /health | ❌ | Health check |
| POST | /issues | ✅ | Create issue |
| GET | /issues | ❌ | List issues |
| GET | /issues/:id | ❌ | Get issue details |
| PATCH | /issues/:id/status | ✅ ADMIN | Update status |
| POST | /issues/:id/comments | ✅ | Add comment |
| GET | /issues/:id/comments | ❌ | Get comments |
| POST | /issues/:id/vote | ✅ | Upvote issue |
| DELETE | /issues/:id/vote | ✅ | Remove vote |

## 🔒 Security Notes

- Passwords hashed with bcryptjs
- JWTs expire (15 min access, 30 days refresh)
- CORS configured per environment
- Helmet.js for HTTP security headers
- Input validation with Zod
- SQL injection prevention via Prisma

## 🐛 Development

### Building
```bash
npm run build        # Compile TypeScript
npm run dev          # Dev server with hot reload
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Browse Database
```bash
npx prisma studio   # Opens Prisma UI
```

### Reset Database
```bash
npx prisma migrate reset  # ⚠️ Deletes all data
```

## 📞 Support

For issues or questions:
1. Check [Backend README](./README.md) for backend setup
2. Check [Frontend README](./frontend/README.md) for frontend setup
3. Review API documentation

## 📄 License

MIT

---

**Happy civic reporting! 🏛️**
