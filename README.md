# 🏠 Roomora — Roommate Finder Platform

> **Find your perfect roommate** based on location, budget, and lifestyle compatibility — with real-time chat built in.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Architecture Diagram](#-architecture-diagram)
4. [Feature List](#-feature-list)
5. [Database Schema](#-database-schema)
6. [API Reference](#-api-reference)
7. [Real-Time Events (Socket.IO)](#-real-time-events-socketio)
8. [Authentication Flow](#-authentication-flow)
9. [Matching Algorithm](#-matching-algorithm)
10. [Premium vs Free](#-premium-vs-free)
11. [Project Structure](#-project-structure)
12. [Environment Variables](#-environment-variables)
13. [Running Locally](#-running-locally)
14. [Deployment](#-deployment)
15. [Security Measures](#-security-measures)

---

## 🎯 Project Overview

**Roomora** is a full-stack web platform that helps people find compatible roommates. Users sign in via Google (or other Firebase providers), complete a detailed profile, set roommate preferences, and instantly see scored matches ranked by location → budget → lifestyle compatibility. Matched users can chat in real time.

### Key Goals
| Goal | Status |
|------|--------|
| Firebase Auth (Google/Facebook/Apple) | ✅ |
| Mandatory profile setup after login | ✅ |
| Roommate matching with scoring engine | ✅ |
| Real-time chat with seen status | ✅ |
| Report & Block system | ✅ |
| Free / Premium tier | ✅ |
| Text-based location matching | ✅ |

---

## 🛠 Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| Auth | Firebase SDK (Google, Facebook, Apple) |
| Real-time | Socket.IO Client |
| HTTP Client | Axios |
| Animations | Framer Motion |
| Icons | Lucide React |
| Toasts | react-hot-toast |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose ODM) |
| Auth Verification | Firebase Admin SDK |
| JWT | jsonwebtoken |
| Real-time | Socket.IO v4 |
| Security | Helmet, CORS, express-rate-limit |
| Dev | Nodemon |
| Fallback DB | MongoDB In-Memory Server (dev only) |

---

## 🏗 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER CLIENT                      │
│  Next.js 16 App  ←→  Firebase SDK  ←→  Socket.IO Client │
└────────────┬──────────────────────────────┬─────────────┘
             │ REST (Axios)                 │ WebSocket
             ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS.JS BACKEND                    │
│                                                         │
│  /api/auth      /api/users     /api/roommate            │
│  /api/chat      /api/report    /api/notifications       │
│                                                         │
│        ┌─────────────────────────┐                      │
│        │   Socket.IO Server      │                      │
│        │  message:send           │                      │
│        │  message:read (seen)    │                      │
│        │  typing:start/stop      │                      │
│        └─────────────────────────┘                      │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
              ┌─────────────────────┐
              │   MongoDB Atlas     │
              │  users              │
              │  messages           │
              │  conversations      │
              │  roommate_requests  │
              │  reports            │
              │  notifications      │
              └─────────────────────┘
```

---

## ✨ Feature List

### 1. Authentication (Firebase)
- **Google Sign-In** — one-click OAuth popup
- **Facebook Sign-In** — via Firebase provider
- **Apple Sign-In** — via Firebase provider
- **Email/Password** — traditional login
- One account per email — prevents duplicate profiles
- JWT issued by backend after Firebase token verification
- Token stored in `localStorage`, attached to every API call

### 2. Profile Setup (Mandatory After Login)
After first login, users are redirected to the profile setup page (`/dashboard/profile?new=1`). They must fill:

| Field | Required | Notes |
|-------|----------|-------|
| Full Name | ✅ | |
| Profile Photo | ✅ | JPEG/PNG, max 2 MB, stored as base64 |
| Age | ✅ | |
| Gender | ✅ | Male / Female / Non-binary / Prefer not to say |
| Occupation | ✅ | Student / Professional / Freelancer / etc. |
| State | ✅ | Used for location matching |
| City | ✅ | Primary matching field |
| Area / Locality | Optional | Bonus matching points |
| Budget (min/max) | ✅ | Monthly rent range in ₹ |
| Sleep Schedule | Optional | Early Bird / Night Owl / Flexible |
| Noise Level | Optional | Quiet / Moderate / Lively |
| Cleanliness | Optional | Slider 1–5 |
| Smoking / Pets / Guests | Optional | Toggle preferences |
| Interests | Optional | Up to 12 tags (Music, Sports, Gaming, etc.) |
| Short Bio | Optional | Free text |

A **completion meter** (0–100%) guides users to fill more fields for better matches.

### 3. Find Roommate System
Located at `/dashboard/find-roommate`. Users can:

- **Set Preferences** (My Preferences tab) — budget range, preferred gender, lifestyle, location, interests
- **Browse Matches** (Matches tab) — scored cards ranked by compatibility
- **Filter** dynamically by State / City / Area / Budget slider / Gender without page reload
- **Message** directly — opens a chat conversation instantly
- **View full profile** of any match
- **Report / Block** any user from hover actions on cards

### 4. Matching Algorithm
Scores are calculated out of **100 points**:

| Factor | Points | Details |
|--------|--------|---------|
| Same City | 20 | Case-insensitive text compare |
| Same Area | +10 | Bonus on top of city |
| Same State | 5 | Fallback if no city |
| Budget Overlap | 25 | Ranges must intersect |
| Sleep Schedule | 8–15 | Exact match |
| Noise Level | 5–10 | Exact match |
| Smoking Preference | 7–8 | Both same |
| Pet Preference | 5–7 | Both same |
| Cleanliness | 2–5 | Within 1 level |
| Shared Interests | Up to 10 | 3 pts per shared interest |

Results are sorted highest → lowest. Only scores ≥ 40 appear in Find Roommate (≥ 20 in My Matches).

### 5. Filters
All filters update results **without page reload**:
- **State** — text input
- **City** — text input  
- **Area** — text input
- **Budget Slider** — ₹3,000 – ₹1,00,000
- **Preferred Gender** — dropdown

### 6. Profile Cards
Each match card shows:
- Profile photo + online indicator
- Name, Age, Gender, Occupation
- City/Area location
- Budget range
- Compatibility score % + grade bar
- Lifestyle tags (🌅 🦉 🐾 🚬 etc.)
- Short bio snippet
- **Message** button (opens chat)
- **View Profile** button
- **Report / Block** hover buttons

### 7. Real-Time Chat System
Located at `/dashboard/chat`. Full-featured messaging:

| Feature | Implementation |
|---------|---------------|
| Live messages | Socket.IO `message:send` / `message:new` |
| Seen status | ✓ sent / ✓✓ cyan = seen |
| Typing indicator | `typing:start` / `typing:stop` + animated dots |
| Online status | `user:online` / `user:offline` events |
| Last seen | Timestamp shown in chat header |
| Unread badge | Per-conversation count in sidebar |
| Chat history | REST API + persisted in MongoDB |
| Chat requests | Accept/reject flow before chatting |
| Direct chat | Bypass request flow (from match cards) |

### 8. Report & Block System
- **Report** — choose reason (harassment, fake profile, spam, etc.) + optional description
- **Block** — removes user from all lists immediately
- Auto-suspend if a user reaches **5 reports**
- Duplicate reports from same reporter are prevented

### 9. Notifications
Located at `/dashboard/notifications`.
- Chat request received
- Chat request accepted
- New message (when not in chat window)
- Mark all as read

### 10. Premium Feature
| Limit | Free | Premium |
|-------|------|---------|
| Find Roommate matches | 15 | 100 |
| Smart Matches | 20 | 50 |
| All filters | ✅ | ✅ |
| Upgrade prompt | Shown at limit | — |

---

## 🗄 Database Schema

### `users`
```js
{
  firebaseUid: String,          // Links to Firebase auth
  name: String,                 // required
  email: String,                // unique, required
  avatar: String,               // base64 or URL
  role: 'user' | 'admin',
  isPremium: Boolean,
  profileSetupComplete: Boolean,
  isVerified: Boolean,
  verificationBadge: Boolean,
  isSuspended: Boolean,
  reportCount: Number,
  blockedUsers: [ObjectId],
  chatRequests: [{
    from: ObjectId,
    status: 'pending' | 'accepted' | 'rejected',
    createdAt: Date
  }],
  profile: {
    age: Number,
    gender: String,
    occupation: String,
    bio: String,
    interests: [String]
  },
  lifestyle: {
    sleepTime: String,          // 'early-bird' | 'night-owl' | 'flexible'
    cleanliness: Number,        // 1–5
    smokingAllowed: Boolean,
    petsAllowed: Boolean,
    guestsAllowed: Boolean,
    noiseLevel: String,         // 'quiet' | 'moderate' | 'lively'
    workSchedule: String
  },
  budget: { min: Number, max: Number },
  isLookingForRoom: Boolean,
  isOnline: Boolean,
  lastSeen: Date,
  location: {
    country: String,
    state: String,
    city: String,
    area: String
  }
}
```

### `roommate_requests` (collection: `roommate_preferences`)
```js
{
  user: ObjectId,               // ref: User
  preferences: {
    budgetMin: Number,
    budgetMax: Number,
    gender: 'any' | 'male' | 'female',
    smokingOk: Boolean,
    petsOk: Boolean,
    guestsOk: Boolean,
    sleepTime: String,
    noiseLevel: String,
    cleanliness: Number,
    interests: [String],
    bio: String
  },
  location: {
    country, state, city, area: String
  },
  status: 'active' | 'matched' | 'closed',
  matchedWith: ObjectId
}
```

### `conversations`
```js
{
  participants: [ObjectId],     // exactly 2 users
  lastMessage: ObjectId,        // ref: Message
  isUnlocked: Boolean,
  unlockedAt: Date
}
```

### `messages`
```js
{
  conversation: ObjectId,
  sender: ObjectId,
  content: String,
  type: 'text' | 'image' | 'system',
  readBy: [ObjectId]            // seen status
}
```

### `reports`
```js
{
  reporter: ObjectId,
  reported: ObjectId,
  reason: 'fake-profile' | 'harassment' | 'spam' | 'inappropriate-content' | 'scam' | 'other',
  description: String,
  status: 'pending' | 'resolved' | 'dismissed'
}
```

### `notifications`
```js
{
  user: ObjectId,
  type: String,                 // 'chat-request' | 'chat-accepted' | 'message' | 'match'
  title: String,
  body: String,
  data: Mixed,
  isRead: Boolean
}
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/firebase` | Verify Firebase token → issue JWT |
| GET | `/api/auth/me` | Get current user (JWT required) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/matches` | Get scored matches for current user |
| GET | `/api/users/nearby?city=&state=` | Users in same city/state |
| PUT | `/api/users/profile` | Update profile (all fields) |
| PUT | `/api/users/location` | Update location only |
| GET | `/api/users/search?q=&city=` | Search users |
| GET | `/api/users/:id` | Get user by ID with compatibility score |
| POST | `/api/users/:id/block` | Block a user |

### Roommate
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/roommate/create` | Create/update roommate preference profile |
| GET | `/api/roommate/match` | Get scored roommate matches (with filters) |
| GET | `/api/roommate/my-profile` | Get own preference profile |
| GET | `/api/roommate/nearby` | Nearby users (text-based) |
| DELETE | `/api/roommate/close` | Close own roommate request |

**Query params for `/api/roommate/match`:**
- `state`, `city`, `area` — location filters
- `budgetMax` — max budget filter
- `gender` — preferred gender filter

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/request` | Send a chat request |
| PUT | `/api/chat/accept/:requestId` | Accept a chat request |
| POST | `/api/chat/direct` | Open/create conversation directly |
| GET | `/api/chat/conversations` | Get all conversations (with unread count) |
| GET | `/api/chat/requests` | Get pending chat requests |
| GET | `/api/chat/:convId/messages` | Get messages + mark as read |
| PUT | `/api/chat/:convId/read` | Mark conversation as read (REST fallback) |

### Reports & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/report` | Report a user |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all notifications read |

---

## ⚡ Real-Time Events (Socket.IO)

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:conversation` | `conversationId` | Join a chat room |
| `message:send` | `{ conversationId, content, type }` | Send a message |
| `message:read` | `{ conversationId }` | Mark messages as seen |
| `typing:start` | `{ conversationId }` | Start typing indicator |
| `typing:stop` | `{ conversationId }` | Stop typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Message object | New message in a conversation |
| `message:seen` | `{ conversationId, seenBy }` | Messages were seen by other user |
| `typing:start` | `{ userId }` | Other user is typing |
| `typing:stop` | `{ userId }` | Other user stopped typing |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |
| `notification:new` | Notification object | Push notification |

**Authentication:** The socket handshake must include `auth: { token: '<JWT>' }`.

---

## 🔐 Authentication Flow

```
User clicks "Sign in with Google"
         │
         ▼
  Firebase signInWithPopup()
         │
         ▼
  Firebase returns ID Token
         │
         ▼
  POST /api/auth/firebase  { idToken }
         │
         ▼
  Backend verifies with Firebase Admin SDK
         │
    ┌────┴─────┐
    │ New user? │
    └────┬─────┘
   Yes   │   No
    ▼    │    ▼
 Create  │  Load existing
 user    │  user from DB
    └────┴────┐
              ▼
       Issue JWT (7 days)
              │
              ▼
    Store in localStorage
    as 'roomora_token'
              │
              ▼
    If !profileSetupComplete
    → redirect to /dashboard/profile?new=1
              │
              ▼
    Dashboard (matches, chat, etc.)
```

---

## 🧮 Matching Algorithm

The scoring is computed in `userController.js` (`calculateCompatibility`) and `roommate.js` route:

```
Score = 0

LOCATION (max 30 pts):
  + 20  if same city (case-insensitive)
  + 10  if also same area
  OR
  +  5  if same state only

BUDGET (max 25 pts):
  + 25  if budget ranges overlap
        (min(maxA, maxB) >= max(minA, minB))

LIFESTYLE (max 45 pts):
  + 15  same sleep schedule
  + 10  same noise level
  +  8  same smoking preference
  +  7  same pet preference
  +  5  same cleanliness level
  +  2  cleanliness within 1 level

INTERESTS (bonus, max 10 pts):
  + 3 per shared interest (capped at 10)

Grade:
  >= 80 → Excellent (green)
  >= 60 → Good (cyan)
  >= 40 → Fair (amber)
   < 40 → Low (red)
```

---

## 👑 Premium vs Free

Premium is toggled via `user.isPremium = true` in MongoDB (admin panel or payment integration).

| Feature | Free | Premium |
|---------|------|---------|
| Roommate matches | 15 | 100 |
| Smart matches | 20 | 50 | 100
| Location filters | ✅ | ✅ |
| Budget filter | ✅ | ✅ |
| Gender filter | ✅ | ✅ |
| Real-time chat | ✅ | ✅ |
| Report/Block | ✅ | ✅ |

---

## 📁 Project Structure

```
capston 2/
├── backend/
│   ├── server.js                   # Express + Socket.IO entry point
│   ├── .env                        # Environment variables
│   └── src/
│       ├── config/
│       │   ├── db.js               # MongoDB connection (Atlas + fallback)
│       │   └── firebase.js         # Firebase Admin SDK init
│       ├── controllers/
│       │   ├── authController.js   # Firebase login, getMe
│       │   ├── userController.js   # Matches, profile, nearby, scoring
│       │   ├── chatController.js   # Conversations, messages, seen status
│       │   ├── roomController.js   # Room listings
│       │   └── adminController.js  # Admin CRUD, notifications
│       ├── middleware/
│       │   └── auth.js             # JWT protect, requirePremium, adminOnly
│       ├── models/
│       │   ├── User.js             # Main user schema
│       │   ├── Chat.js             # Message + Conversation schemas
│       │   ├── RoommateRequest.js  # Roommate preferences schema
│       │   ├── Room.js             # Room listing schema
│       │   └── Report.js          # Report + Notification schemas
│       ├── routes/
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── roommate.js         # /match, /nearby, /create
│       │   ├── chat.js             # /conversations, /messages, /read
│       │   ├── rooms.js
│       │   ├── report.js
│       │   └── admin.js            # notifications, admin endpoints
│       └── utils/
│           └── socket.js           # Socket.IO setup + event handlers
│
└── frontend/
    ├── .env.local                  # Frontend environment variables
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout (providers)
        │   ├── page.tsx            # Landing page
        │   ├── login/
        │   │   └── page.tsx        # Login page (Google/Email)
        │   └── dashboard/
        │       ├── layout.tsx      # Sidebar nav + auth guard
        │       ├── page.tsx        # Dashboard home
        │       ├── find-roommate/
        │       │   └── page.tsx    # 🌟 Main feature: find + filter + match
        │       ├── matches/
        │       │   └── page.tsx    # Smart matches (scored)
        │       ├── chat/
        │       │   └── page.tsx    # Real-time chat with seen status
        │       ├── browse/
        │       │   ├── page.tsx    # Browse nearby users
        │       │   └── [id]/
        │       │       └── page.tsx # Individual user profile
        │       ├── profile/
        │       │   └── page.tsx    # Profile setup + edit
        │       ├── notifications/
        │       │   └── page.tsx
        │       ├── rooms/
        │       │   └── page.tsx
        │       └── admin/
        │           └── page.tsx
        ├── context/
        │   ├── AuthContext.tsx     # Firebase auth state + JWT sync
        │   └── SocketContext.tsx   # Socket.IO connection
        ├── lib/
        │   ├── api.ts              # Axios instance + interceptors
        │   └── firebase.ts         # Firebase app init
        └── components/
            └── MapView.tsx         # (Legacy map component)
```

---

## 🔧 Environment Variables

### Backend — `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/roomora

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

NODE_ENV=development
```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Atlas account (or use the built-in in-memory fallback for dev)
- Firebase project with Authentication enabled

### Step 1 — Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — Configure environment variables

Copy the examples:
```bash
# Backend
cp backend/.env.example backend/.env
# Fill in MONGODB_URI, JWT_SECRET, Firebase Admin credentials

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Fill in Firebase web config keys
```

### Step 3 — Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → API running at http://localhost:5000
# → Socket.IO ready
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running at http://localhost:3000
```

### Step 4 — Open the app
Navigate to **http://localhost:3000** and sign in with Google.

> 💡 **Dev tip:** If MongoDB Atlas is unreachable, the backend automatically falls back to an in-memory MongoDB instance — great for local development without any setup.

---

## ☁️ Deployment

### Backend (Render / Railway / Fly.io)
1. Set all environment variables in the platform dashboard
2. Build command: `npm install`
3. Start command: `node server.js`
4. Set `CLIENT_URL` to your frontend domain

### Frontend (Vercel)
1. Import the `frontend/` directory to Vercel
2. Set all `NEXT_PUBLIC_*` environment variables
3. Vercel auto-detects Next.js — deploy

### `vercel.json` (already configured in `/backend`)
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## 🔒 Security Measures

| Measure | Implementation |
|---------|---------------|
| JWT Authentication | All `/api/*` routes (except `/auth/firebase`) require Bearer token |
| Firebase token verification | Backend verifies every Firebase ID token with Admin SDK |
| One account per email | `findOne({ $or: [{ email }, { firebaseUid }] })` prevents duplicates |
| Rate limiting | 200 requests / 15 min per IP (`express-rate-limit`) |
| Helmet | HTTP security headers |
| CORS | Restricted to `CLIENT_URL` origin |
| Input validation | Mongoose schema validators + route-level checks |
| Auto-suspend | Users auto-suspended after 5 reports |
| Block system | Blocked users excluded from all match queries |
| Admin only routes | `adminOnly` middleware on `/api/admin/*` |
| Socket auth | JWT verified on every WebSocket connection |
| Photo size limit | 2 MB max, validated on client + server |

---

## 👨‍💻 Development Notes

- **No GPS required** — All location matching is text-based (city/state/area strings). Users set their location in their profile.
- **In-memory MongoDB fallback** — The backend detects Atlas connection failures and boots a local in-memory MongoDB automatically. Perfect for demos and CI.
- **Mock Firebase fallback** — If Firebase Admin credentials are missing/invalid, auth middleware accepts any JWT (dev only). **Do not use in production.**
- **Socket.IO reconnection** — The `SocketContext` automatically reconnects when the user token changes.
- **Profile photo** — Stored as base64 string in MongoDB (max 2 MB). For production, consider moving to Firebase Storage or Cloudinary.

---

## 📜 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ for Capstone Project 2 — Roomora Roommate Finder Platform*
