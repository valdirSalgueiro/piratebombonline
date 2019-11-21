module.exports = (io) => {
  const players = {};

  const firstNameArray = [
    'Captain', 'King', 'Jack', 'Ramsey', 'Russel', 'Odin', 'Waldwick', 'Gilbert', 'Jose', 'Emperor', 'Hector', 'William'
  ];
  
  const lastNameArray = [
    'Forrest', 'Sparrow','Rufus', 'Darby', 'Bolton', 'Arch', 'Juan', 'Morgan', 'BlackBeard', 'Lynch', 'Hook' , 'Crow', 'Claw', 'Barbarossa'
  ];
  
  const nicknameArray = [
    'Stinky','Crocked','White Beard','One Eye','Shaded','Coward','Scurvy', 'Braveheart', 'Mad Eyes', 'One Legged'
  ];
  
  function generateRandomName(){
    let fn = firstNameArray[Math.floor(Math.random()* firstNameArray.length)];
    //let ln = lastNameArray[Math.floor(Math.random()* lastNameArray.length)];
    let nn = nicknameArray[Math.floor(Math.random()* nicknameArray.length)];
    return fn + " '" + nn + "'";
  }

  io.on("connection", function(socket) {
    console.log("a user connected: ", socket.id);
    const first_name = socket.request.user
      ? socket.request.user._json.first_name
      : generateRandomName();
    console.log(first_name);
    players[socket.id] = {
      playerId: socket.id,
      playerName: first_name,
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
        playerName: id,
        kills: 0,
        deaths: 0,
        score: 0
      };
      socket.broadcast.emit("newPlayer", players[id]);
    });

    socket.on("disconnect", function() {
      console.log("user disconnected: ", socket.id);
      const botId = players[socket.id].bot;
      delete players[botId];
      delete players[socket.id];
      io.emit("disconnect", socket.id);
      io.emit("disconnect", botId);
    });

    socket.on("playerMovement", function(movementData) {
      const playerId = movementData.id ? movementData.id : socket.id;
      players[playerId] = { ...players[playerId], ...movementData };
      socket.broadcast.emit("playerMoved", players[playerId]);
    });

    socket.on("playerShoot", (id, x, y) => {
      socket.broadcast.emit("playerShoot", { id, x, y });
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
      io.emit("new message", { username: players[socket.id].playerName, message });
    });

    setInterval(() => {
      const values = Object.values(players);
      io.emit("score", values);
    }, 3000);
  });
};
