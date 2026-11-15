# Backend Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` in the `backend` directory, then set the required values:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/placify
SECRET_KEY=replace-with-a-random-secret
PORT=3000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
```

For production, set `FRONTEND_URL` to the deployed frontend's origin. Multiple comma-separated origins are supported.

AI features use Google's Gemini 3.5 Flash-Lite through the backend. Create a free API key in [Google AI Studio](https://aistudio.google.com/apikey), add it to `GEMINI_API_KEY` in `backend/.env`, and restart the backend. The free tier has usage limits and Google's free-tier data terms apply. Keep the key on the backend; do not add it to frontend code or commit it.

### MongoDB Connection String Examples:
- Local MongoDB: `mongodb://localhost:27017/placify`
- MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/placify`

### Generate JWT Secret Key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Common Issues

### Port Already in Use
If you see `EADDRINUSE` error, either:
- Stop the process using port 3000
- Change the PORT in your `.env` file

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your connection string is correct
- For MongoDB Atlas, ensure your IP is whitelisted

### Missing Environment Variables
- Make sure you have a `.env` file in the `backend` directory
- Check that all required variables are set

## API Endpoints

- `POST /signup` - Create new user
- `POST /signin` - User login
- `GET /get-user-details` - Get user details (requires auth)
- `GET /api/partners` - Get all partners
- `POST /api/partners` - Create partner profile (requires auth)
- `GET /api/connections/requests` - Get connection requests (requires auth)
- `POST /api/connections` - Send connection request (requires auth)
- `GET /api/chat/:connectionId` - Get chat messages (requires auth)
- `POST /api/chat` - Send message (requires auth)

