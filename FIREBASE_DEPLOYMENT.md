# Firebase Deployment Guide

## Project: CCIRS (Crowdsourced Civic Issue Reporting System)
**Firebase Project ID:** `crowdsourced-civic-issue-1f5fe`

## Architecture 
- **Backend:** Express.js + Firebase Cloud Functions
- **Database:** Firestore (NoSQL)
- **Authentication:** Firebase ID tokens
- **Hosting:** Firebase Hosting + Cloud Functions
- **Rules:** Firestore security rules for access control

## Prerequisites

1. **Google Cloud/Firebase Account** - Create one at https://console.firebase.google.com
2. **Firebase CLI** - Install: `npm install -g firebase-tools` (or use `npx firebase`)
3. **Node.js** - v18 or later
4. **gcloud CLI** - https://cloud.google.com/sdk/docs/install

## Local Development Setup

### 1. Authenticate with Firebase
```bash
firebase login
```
This opens a browser to authenticate. You'll be logged in locally.

### 2. Install Dependencies
```bash
npm install
cd functions && npm install && cd ..
```

### 3. Build TypeScript
```bash
npm run build
```

### 4. Run Locally (with Emulator)
```bash
npm run firebase:emulate
```
This starts local Firestore, Functions, and Auth emulators on `localhost:5000`

Or for development with hot-reload:
```bash
npm run dev
```
Server runs on `http://localhost:3000`

## Deployment Steps

### 1. Set Environment Variables

Create `.env` file in root:
```env
FIREBASE_PROJECT_ID=crowdsourced-civic-issue-1f5fe
FIREBASE_CLIENT_EMAIL=your-service-account@crowdsourced-civic-issue-1f5fe.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-private-key-here
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 2. Create Firebase Service Account

In Firebase Console:
1. Go to **Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Copy the JSON and set environment variables from it

### 3. Deploy to Firebase

#### Option A: Deploy Everything
```bash
firebase deploy
```
This deploys:
- Cloud Functions (`api` function)
- Firestore rules
- Firebase Hosting

#### Option B: Deploy Only Functions
```bash
npm run firebase:deploy
```

#### Option C: Deploy with Custom Config
```bash
firebase deploy --only functions:api
```

### 4. Verify Deployment

```bash
# Check function logs
firebase functions:log

# Test the API
curl https://us-central1-crowdsourced-civic-issue-1f5fe.cloudfunctions.net/api/health

# View deployed functions
firebase functions:list
```

## API Endpoints

After deployment, all endpoints are available under:
```
https://us-central1-crowdsourced-civic-issue-1f5fe.cloudfunctions.net/api
```

### Auth Endpoints
- `GET /api/auth/me` - Get current user
- `POST /api/auth/sync` - Sync user to Firestore
- `POST /api/auth/logout` - Logout (optional)

### Issues Endpoints
- `GET /api/issues` - List all issues
- `POST /api/issues` - Create new issue (auth required)
- `GET /api/issues/:id` - Get issue detail
- `PATCH /api/issues/:id/status` - Update status (moderator)
- `POST /api/issues/:id/vote` - Vote on issue
- `DELETE /api/issues/:id/vote` - Remove vote
- `POST /api/issues/:id/comments` - Add comment

### Transparency Endpoints
- `GET /api/transparency/issues` - Public issues list
- `GET /api/transparency/issues/:id/timeline` - Issue timeline & ledger
- `GET /api/transparency/stats` - System statistics

## Firestore Database Structure

```
firestore/
├── users/{uid}
│   ├── email: string
│   ├── name: string
│   ├── role: CITIZEN | MODERATOR | ADMIN
│   └── createdAt: timestamp
│
├── issues/{issueId}
│   ├── title: string
│   ├── description: string
│   ├── status: OPEN | IN_PROGRESS | RESOLVED | CLOSED
│   ├── category: string (from AI classification)
│   ├── department: string (from AI routing)
│   ├── severity: LOW | MEDIUM | HIGH | CRITICAL
│   ├── address: string
│   ├── voteCount: number
│   ├── commentCount: number
│   ├── createdAt: timestamp
│   │
│   ├── comments/{commentId} (subcollection)
│   │   ├── userId: string
│   │   ├── text: string
│   │   └── createdAt: timestamp
│   │
│   ├── votes/{voteId} (subcollection)
│   │   ├── userId: string
│   │   └── createdAt: timestamp
│   │
│   └── ledger/{entryId} (subcollection - optional)
│       ├── eventType: string
│       ├── payload: object
│       ├── hash: string
│       ├── prevHash: string
│       └── timestamp: timestamp
```

## Firestore Security Rules

Rules are in `firestore.rules`:
- Users can only read/write their own document
- Issues are publicly readable
- Only authenticated users can create issues
- Only issue creator or moderators can update/delete
- Comments and votes have per-user access control
- Ledger is append-only (backend only)

Deploy rules with:
```bash
firebase deploy --only firestore:rules
```

## Monitoring & Logging

### View Function Logs
```bash
firebase functions:log --limit 50
```

### Monitor Firestore Usage
1. Go to Firebase Console → Firestore → Database
2. View reads/writes/deletes in real-time
3. Check "Composite Indexes" if you add complex queries

### Set Up Alerts
1. Firebase Console → Monitoring
2. Create alert policies for:
   - High read/write rates
   - Function execution time
   - Error rates

## Scaling Considerations

- **Firestore:** Auto-scales reads/writes (pay per operation)
- **Functions:** Auto-scales concurrent executions
- **Limits:**
  - Document size: 1 MB max
  - Write rate per document: ~1 write/second
  - Read throughput: Scales automatically

### Optimize for Scale
1. Use composite indexes for complex queries
2. Batch operations where possible
3. Implement pagination on list endpoints
4. Cache static data (departments, categories, etc.)

## Troubleshooting

### 404 on API endpoints
- Check Cloud Function URL format
- Verify express routes are correctly mounted
- Check `firebase.json` rewrites config

### Authentication issues
- Verify Firebase ID token in `Authorization: Bearer <token>` header
- Check `.firebaserc` has correct project ID
- Ensure Firebase Auth is enabled in Firebase Console

### Firestore permission denied
- Check security rules in `firestore.rules`
- Verify user is authenticated
- Check user's custom claims/roles

### Cold starts
- Cloud Functions have 100ms cold start time
- Use `--memory=256MB` or higher for faster execution
- Keep function code minimal

## Advanced Deployment

### Custom Domain
1. Firebase Console → Hosting → Connect domain
2. Point DNS to Firebase-provided IP
3. Redeploy: `firebase deploy`

### Custom Environment Variables
Store in Cloud Functions config:
```bash
firebase functions:config:set app.env="production"
firebase deploy --only functions
```

Access in code:
```typescript
const config = functions.config();
const env = config.app.env;
```

### Database Backup
1. Cloud Console → Firestore → Manage databases
2. Click **Create database backup**
3. Schedule automatic daily backups

## CI/CD Pipeline Example (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: crowdsourced-civic-issue-1f5fe
```

## Support & Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Guide:** https://firebase.google.com/docs/firestore
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **CLI Reference:** https://firebase.google.com/docs/cli
