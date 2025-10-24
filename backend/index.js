require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get('/api/status', (_req, res) => {
  res.json({ ok: true, service: 'signaling', time: new Date().toISOString() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// In-memory room tracking
const rooms = new Map(); // roomId -> { children: Set<string>, admins: Set<string>, activeChildren: Set<string> }

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { children: new Set(), admins: new Set(), activeChildren: new Set() });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  let currentRoomId = null;
  let role = null; // 'child' | 'admin'
  let sharingActive = false;

  // Join a room and optionally set role
  socket.on('join', (payload) => {
    const { roomId, role: joinRole } = typeof payload === 'object' ? payload : { roomId: payload };
    currentRoomId = roomId;
    if (joinRole) role = joinRole;
    socket.join(roomId);
    const room = ensureRoom(roomId);
    if (role === 'admin') room.admins.add(socket.id);
    if (role === 'child') room.children.add(socket.id);
    io.to(roomId).emit('peer-joined', { socketId: socket.id, role });
    // Send current active children list to the new admin
    if (role === 'admin') {
      socket.emit('active-children', { children: Array.from(room.activeChildren) });
      // Ask active children to send fresh offers to this admin
      room.activeChildren.forEach((childId) => {
        io.to(childId).emit('request-offer', { to: socket.id, roomId });
      });
    }
  });

  socket.on('register-role', (r) => {
    role = r;
    if (!currentRoomId) return;
    const room = ensureRoom(currentRoomId);
    if (role === 'admin') room.admins.add(socket.id);
    if (role === 'child') room.children.add(socket.id);
  });

  // Child offer to Admin (directed when 'to' provided, else broadcast to room)
  socket.on('offer', ({ roomId, sdp, to }) => {
    const room = ensureRoom(roomId);
    sharingActive = true;
    room.activeChildren.add(socket.id);
    // notify admins about active children update
    io.to(roomId).emit('active-children', { children: Array.from(room.activeChildren) });
    if (to) {
      io.to(to).emit('offer', { sdp, from: socket.id });
    } else {
      // fallback broadcast
      socket.to(roomId).emit('offer', { sdp, from: socket.id });
    }
  });

  // Admin answer back to specific child
  socket.on('answer', ({ roomId, sdp, to }) => {
    if (to) {
      io.to(to).emit('answer', { sdp, from: socket.id });
    } else {
      socket.to(roomId).emit('answer', { sdp, from: socket.id });
    }
  });

  // Directed ICE candidates (both sides should include 'to')
  socket.on('candidate', ({ roomId, candidate, to }) => {
    if (to) {
      io.to(to).emit('candidate', { candidate, from: socket.id });
    } else {
      socket.to(roomId).emit('candidate', { candidate, from: socket.id });
    }
  });

  // Child explicitly stops sharing
  socket.on('stop-share', () => {
    if (!currentRoomId) return;
    const room = ensureRoom(currentRoomId);
    if (sharingActive) {
      room.activeChildren.delete(socket.id);
      sharingActive = false;
      io.to(currentRoomId).emit('child-stopped', { childId: socket.id });
      io.to(currentRoomId).emit('active-children', { children: Array.from(room.activeChildren) });
    }
  });

  socket.on('get-active-children', () => {
    if (!currentRoomId) return;
    const room = ensureRoom(currentRoomId);
    socket.emit('active-children', { children: Array.from(room.activeChildren) });
    // Prompt all active children to send fresh offers to this admin
    room.activeChildren.forEach((childId) => {
      io.to(childId).emit('request-offer', { to: socket.id, roomId: currentRoomId });
    });
  });

  socket.on('disconnecting', () => {
    const roomId = currentRoomId;
    if (roomId) {
      const room = ensureRoom(roomId);
      room.children.delete(socket.id);
      room.admins.delete(socket.id);
      if (sharingActive) {
        room.activeChildren.delete(socket.id);
        io.to(roomId).emit('child-stopped', { childId: socket.id });
      }
      io.to(roomId).emit('peer-disconnected', { socketId: socket.id });
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Signaling server listening on :${PORT}`);
});


