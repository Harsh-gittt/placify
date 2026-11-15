# Placify

Placify is a career-preparation platform for students. It brings interview practice, learning resources, study-partner discovery, and AI-assisted career tools into one web app.

## Features

- Practice DSA, aptitude, core-subject, and HR questions.
- Find study partners by name or skill. Demo profiles are display-only and cannot receive connection requests.
- Practice mock interviews and explore company-specific career guidance.
- Upload a PDF resume for ATS-style feedback and improvement suggestions.
- Sign in, manage a profile, and use partner connections and chat.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB with Mongoose, Socket.IO
- **AI:** Google Gemini Developer API
- **PDF processing:** PDF.js

## Requirements

- Node.js 20.16+ (or 22.3+)
- MongoDB, running locally or available through MongoDB Atlas
- A Gemini API key for AI-powered features

## Getting started

Run these commands from the repository root.

### 1. Install dependencies

```powershell
npm install
Set-Location backend
npm install
Set-Location ..
```

### 2. Configure the backend

Create a backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set the values in `backend\.env`:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/placify
SECRET_KEY=replace-with-a-long-random-secret
PORT=3000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
```

The current Vercel frontend origin is allowlisted by the backend. Set `FRONTEND_URL` for any additional production or preview origins. The production frontend uses the hosted backend by default; set `VITE_API_BASE_URL` at build time to override it.

Generate a JWT secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). The free tier has usage limits. Keep the key in the backend `.env` file—never put it in frontend code or commit it. Resume analysis sends extracted resume text to Gemini; use a sample resume rather than confidential personal documents.

### 3. Start the backend

In one terminal:

```powershell
Set-Location backend
npm run dev
```

The backend connects to MongoDB before it starts listening on port `3000`.

### 4. Start the frontend

In a second terminal at the repository root:

```powershell
npm run dev
```

Open the URL Vite prints (typically [http://localhost:5173](http://localhost:5173)).

## Useful commands

From the repository root:

```powershell
npm run build
npm run lint
```

From the `backend` directory:

```powershell
npm start
```

## Project structure

```text
backend/      Express API, MongoDB models, and Gemini proxy
public/       Static assets and PDF.js worker
src/          React application
  components/ Feature and shared UI components
  context/    Theme and chat state
  lib/        API clients and PDF utilities
```
