// reads in our .env file and makes those values available as environment variables
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const routes = require('./routes/main');
const secureRoutes = require('./routes/secure');
const passwordRoutes = require('./routes/password');
const asyncMiddleware = require('./middleware/asyncMiddleware');
const ChatModel = require('./models/chatModel');

// setup mongo connection
const uri = process.env.MONGO_CONNECTION_URL;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
mongoose.connection.on('error', (error) => {
  console.log(error);
  process.exit(1);
});
mongoose.connection.on('connected', function () {
  console.log('connected to mongo');
});
mongoose.set('useFindAndModify', false);

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
    deaths: 0
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

  socket.on('playerShoot', () => {
    socket.broadcast.emit('playerShoot', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
  });

  socket.on('setToken', (token) => {
    const name = routes.getName(token);
    console.log(`${socket.id}: ${name}`);
    players[socket.id].name = name;
    io.emit('setName', socket.id, name);
  });

  socket.on('playerDead', (killerId) => {
    console.log(`${killerId} killed ${socket.id}`)
    if (killerId == socket.id) {
      players[socket.id].deaths++;
    }
    else {
      players[killerId].kills++;
      players[socket.id].deaths++;
    }
    io.emit('score', players);
  });
});

// update express settings
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(cookieParser());

// require passport auth
require('./auth/auth');

app.get('/game.html', passport.authenticate('jwt', { session: false }), function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.get('/game.html', function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// main routes
app.use('/', routes);
app.use('/', passwordRoutes);
app.use('/', passport.authenticate('jwt', { session: false }), secureRoutes);

app.post('/submit-chatline', passport.authenticate('jwt', { session: false }), asyncMiddleware(async (req, res, next) => {
  const { message } = req.body;
  const { email, name } = req.user;
  await ChatModel.create({ email, message, game: 'pirate' });
  io.emit('new message', {
    username: name,
    message,
  });
  res.status(200).json({ status: 'ok' });
}));

// catch all other routes
app.use((req, res, next) => {
  res.status(404).json({ message: '404 - Not Found' });
});

// handle errors
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
