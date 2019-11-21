require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const passport = require("passport");
const strategy = require("passport-facebook");
const cookieParser = require("cookie-parser");
const userRoutes = require("./userRoutes");
var bodyParser = require("body-parser");
const UserModel = require("./models/userModel");
const processSocket = require("./socket");

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passportSocketIo = require("passport.socketio");

const FacebookStrategy = strategy.Strategy;

const uri = process.env.MONGO_CONNECTION_URL;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});
mongoose.connection.on("error", error => {
  console.log(error);
  process.exit(1);
});
mongoose.connection.on("connected", function() {
  console.log("connected to mongo");
});
mongoose.set("useFindAndModify", false);

var sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });
var sessionMiddleWare = session({
  store: sessionStore,
  secret: "pbomb",
  resave: false,
  saveUninitialized: true
});
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "connect.sid",
    secret: "pbomb",
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");
  accept();
}

function onAuthorizeFail(data, message, error, accept) {
  console.log(message);
  accept(new Error(message));
}

processSocket(io);

app.use("/", userRoutes);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
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
        await UserModel.create({
          id: profile.id,
          lastName: last_name,
          name: first_name
        });
        console.log("user persisted");
      }
      done(null, profile);
    }
  )
);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
