require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const passport = require('passport');
const strategy = require('passport-facebook');
const cookieParser = require('cookie-parser');
const userRoutes = require('./userRoutes');
var bodyParser = require('body-parser');
const UserModel = require('./models/userModel');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passportSocketIo = require("passport.socketio");

const FacebookStrategy = strategy.Strategy;
const players = {};

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


var sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });
var sessionMiddleWare = session({
  store: sessionStore,
  secret: 'pbomb',
  resave: false,
  saveUninitialized: true
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'connect.sid',
  secret: 'pbomb',
  store: sessionStore,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail,
}));

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept();
}

function onAuthorizeFail(data, message, error, accept) {
  console.log(message);
  accept(new Error(message));
}

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  const { first_name } = socket.request.user._json;
  console.log(first_name);
  players[socket.id] = {
    playerId: socket.id,
    name: first_name,
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

  socket.on('new message', message => {
    io.emit('new message', { username: players[socket.id].name, message });
  });


  setInterval(() => {
    const values = Object.values(players);
    io.emit('score', values);
  }, 3000);
});

app.use("/", userRoutes);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["email", "name"]
    },
    async (accessToken, refreshToken, profile, done) => {
      const { first_name, last_name } = profile._json;
      const user = await UserModel.find({ id: profile.id });
      if (!user) {
          await UserModel.create({ id: profile.id, lastName: last_name, name: first_name });
          console.log('user persisted');
      };
      done(null, profile);
    }
  )
);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
