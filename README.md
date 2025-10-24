# Real-time Screen Sharing (Browser-to-Browser)

A complete web-based screen sharing system: React + Vite + Chakra UI frontend, Node + Express + Socket.IO signaling backend, and WebRTC for media.

## Tech
- Frontend: React + Vite, Chakra UI, React Router, Socket.IO client
- Backend: Node, Express, Socket.IO
- Media: WebRTC (STUN: `stun:stun.l.google.com:19302`)

## Prerequisites
- Node.js 18+

## Setup

### 1) Backend
```
cd backend
copy .env.example .env
npm install
npm run dev
```
- Health: GET http://localhost:4000/api/status

### 2) Frontend
If Vite scaffolding already exists, just install and run. If not, the minimal Vite config and files are present.
```
cd frontend
copy ENV.EXAMPLE.txt .env
npm install
npm run dev
```
- Open `http://localhost:5173`

## Usage
- Open two tabs/machines on the same network (or internet with proper CORS):
  - Child tab: `http://localhost:5173/child` -> click "Start Screen Share"
  - Admin tab: `http://localhost:5173/admin` -> live video appears upon connection
- Both default to room `family-room-1`. To change, set `VITE_DEFAULT_ROOM_ID` on the frontend and ensure both tabs share the same value.

## Environment
- Backend `.env`
  - `PORT=4000`
  - `FRONTEND_ORIGIN=http://localhost:5173`
- Frontend `.env`
  - `VITE_SERVER_URL=http://localhost:4000`
  - `VITE_DEFAULT_ROOM_ID=family-room-1`

## Notes
- Socket.IO handles signaling: `offer`, `answer`, `candidate`, `peer-joined`, `peer-disconnected`.
- Clean disconnection is handled when tabs close. The child stops tracks on Stop or when the share ends.
