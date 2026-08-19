require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'chat1999';
const SESSION_SECRET = process.env.SESSION_SECRET || 'a8f3-cambia-esto-si-quieres-9k2m-mas-seguro';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --------- Autenticación simple por contraseña compartida ---------
function signToken() {
  const payload = 'granted';
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function isValidToken(token) {
  if (!token) return false;
  const [payload, hmac] = token.split('.');
  if (!payload || !hmac) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return payload === 'granted' && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}

function requireAuth(req, res, next) {
  const token = req.cookies.access_token;
  if (isValidToken(token)) return next();
  return res.redirect('/');
}

app.post('/api/login', (req, res) => {
  const { password, ageConfirmed, termsAccepted } = req.body;

  if (!ageConfirmed || !termsAccepted) {
    return res.status(400).json({ error: 'Debes confirmar que eres mayor de edad y aceptar los términos.' });
  }

  if (password !== ACCESS_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }

  const token = signToken();
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12, // 12 horas
  });
  res.json({ ok: true });
});

app.get('/chat', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// --------- Emparejamiento aleatorio + señalización WebRTC ---------
let waitingUser = null;
const partners = new Map();

function cleanupSocket(socketId) {
  if (waitingUser === socketId) waitingUser = null;

  const partnerId = partners.get(socketId);
  if (partnerId) {
    partners.delete(socketId);
    partners.delete(partnerId);
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit('partner-left');
    }
  }
}

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || '';
  const match = cookieHeader.match(/access_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (isValidToken(token)) return next();
  return next(new Error('No autorizado'));
});

io.on('connection', (socket) => {
  socket.on('find-partner', () => {
    cleanupSocket(socket.id);

    if (waitingUser && waitingUser !== socket.id && io.sockets.sockets.get(waitingUser)) {
      const partnerId = waitingUser;
      waitingUser = null;

      partners.set(socket.id, partnerId);
      partners.set(partnerId, socket.id);

      io.to(partnerId).emit('matched', { initiator: true });
      io.to(socket.id).emit('matched', { initiator: false });
    } else {
      waitingUser = socket.id;
      socket.emit('waiting');
    }
  });

  socket.on('signal', (data) => {
    const partnerId = partners.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('signal', data);
    }
  });

  socket.on('report', () => {
    const partnerId = partners.get(socket.id);
    console.log(`[REPORTE] ${socket.id} reportó a ${partnerId || 'desconocido'} — ${new Date().toISOString()}`);
    cleanupSocket(socket.id);
    socket.emit('left-chat');
  });

  socket.on('leave-chat', () => {
    cleanupSocket(socket.id);
  });

  socket.on('disconnect', () => {
    cleanupSocket(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
