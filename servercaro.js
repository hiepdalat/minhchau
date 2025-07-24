// servercaro.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let waitingPlayer = null;

io.on('connection', socket => {
  console.log('🔌 New connection:', socket.id);

  socket.on('join', () => {
    if (waitingPlayer) {
      const opponent = waitingPlayer;
      waitingPlayer = null;

      socket.room = opponent.room = socket.id + '#' + opponent.id;
      socket.join(socket.room);
      opponent.join(socket.room);

      socket.emit('init', 'O');
      opponent.emit('init', 'X');
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on('move', ({ row, col }) => {
    socket.to(socket.room).emit('opponentMove', { row, col });
  });

  socket.on('chat', msg => {
    socket.to(socket.room).emit('chat', 'Đối thủ: ' + msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

