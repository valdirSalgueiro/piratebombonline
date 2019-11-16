// reads in our .env file and makes those values available as environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const ChatModel = require('./models/chatModel');

// setup mongo connection
// const uri = process.env.MONGO_CONNECTION_URL;
// mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
// mongoose.connection.on('error', (error) => {
//   console.log(error);
//   process.exit(1);
// });
// mongoose.connection.on('connected', function () {
//   console.log('connected to mongo');
// });
// mongoose.set('useFindAndModify', false);

// create an instance of an express app
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const players = {};

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  players[socket.id] = {
    playerId: socket.id,
    kills: 0,
    deaths: 0,
    score: 0
  };
  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    io.emit('disconnect', socket.id);
  });

  socket.on('playerMovement', function (movementData) {
    players[socket.id] = { ...players[socket.id], ...movementData };
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('playerShoot', (x, y) => {
    socket.broadcast.emit('playerShoot', { id: socket.id, x, y });
  });

  socket.on('playerDead', (killerId, dx, dy) => {
    console.log(`${killerId} killed ${socket.id}`)
    if (killerId == socket.id) {
      players[socket.id].deaths++;
    }
    else {
      players[killerId].kills++;
      players[socket.id].deaths++;
    }
    players[socket.id].score = players[socket.id].kills - players[socket.id].deaths;
    socket.broadcast.emit('playerDead', socket.id, dx, dy);
  });

  setInterval(() => {
    const values = Object.values(players);
    io.emit('score', values);
  }, 1000);
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
});


server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
