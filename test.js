const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const path = require("path");
const processSocket = require('./socket');

app.use(express.static(path.join(__dirname, "public")));
const players = {};
processSocket(io, players);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
