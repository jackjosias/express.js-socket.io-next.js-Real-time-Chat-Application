const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Add base route
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    if (username && typeof username === 'string') {
      users.set(socket.id, username);
      io.emit('userJoined', {
        username,
        users: Array.from(users.values())
      });
      console.log(`${username} joined the chat`);
    }
  });

  // Handle messages
  socket.on('message', (data) => {
    const username = users.get(socket.id);
    if (username && data?.message) {
      io.emit('message', {
        username,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('userLeft', {
        username,
        users: Array.from(users.values())
      });
      console.log(`${username} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});