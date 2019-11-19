module.exports = (io, players) => {
  io.on("connection", function(socket) {
    console.log("a user connected: ", socket.id);
    const first_name = socket.request.user
      ? socket.request.user._json.first_name
      : "alfred";
    console.log(first_name);
    players[socket.id] = {
      playerId: socket.id,
      name: first_name,
      kills: 0,
      deaths: 0,
      score: 0
    };
    socket.emit("currentPlayers", players);
    socket.broadcast.emit("newPlayer", players[socket.id]);

    socket.on("botConnect", function(id) {
      console.log("bot connected: ", id);
      players[socket.id].bot = id;
      players[id] = {
        playerId: id,
        name: id,
        kills: 0,
        deaths: 0,
        score: 0
      };
      socket.broadcast.emit("newPlayer", id);
    });

    socket.on("disconnect", function() {
      console.log("user disconnected: ", socket.id);
      delete players[players[socket.id].bot];
      delete players[socket.id];
      io.emit("disconnect", socket.id);
    });

    socket.on("playerMovement", function(movementData) {
      players[socket.id] = { ...players[socket.id], ...movementData };
      socket.broadcast.emit("playerMoved", players[socket.id]);
    });

    socket.on("playerShoot", (x, y) => {
      socket.broadcast.emit("playerShoot", { id: socket.id, x, y });
    });

    socket.on("playerDead", (id, killerId, dx, dy) => {
      const playerId = id ? id : socket.id;
      console.log(`${killerId} killed ${playerId}`);
      if (killerId == playerId) {
        players[playerId].deaths++;
      } else {
        players[killerId].kills++;
        players[playerId].deaths++;
      }
      players[playerId].score =
        players[playerId].kills - players[playerId].deaths;
      socket.broadcast.emit("playerDead", playerId, dx, dy);
    });

    socket.on("new message", message => {
      io.emit("new message", { username: players[socket.id].name, message });
    });

    setInterval(() => {
      const values = Object.values(players);
      io.emit("score", values);
    }, 3000);
  });
};
