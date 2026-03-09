# Pépète Launch Checklist

## 1) Backend
- Copy `backend/.env.example` to `backend/.env` and fill real values.
- Install deps: `cd backend && npm install`
- Start API: `npm run dev`
- Check health: `http://localhost:5000/api/health`

## 2) Expo app (mobile + web)
- Copy `app-expo/.env.example` to `app-expo/.env`
- Set `EXPO_PUBLIC_API_URL` to backend URL
- Install deps: `cd app-expo && npm install`
- Start: `npm start`

## 3) React Native app (legacy)
- Copy `app/.env.example` to `app/.env` (optional)
- Install deps: `cd app && npm install`
- Start metro: `npm start`

## 4) Pre-launch smoke test
- Register user
- Login/logout
- Product scan/search
- Pet sitter list + detail
- Booking create/status
- Messaging (socket)
- AI endpoint response

## 5) Production basics
- Set strict `CORS_ORIGINS`
- Set strong `JWT_SECRET`
- Confirm database backups
- Monitor backend logs during launch day
