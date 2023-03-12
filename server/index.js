const express = require('express');
const app = express();
const cors = require('cors')


const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(__dirname + "/public"));

const rooms = { main: [] }

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  io.emit("new-user", { latestConnection: socket.id, connectionCount: io.engine.clientsCount })

  socket.on("send-msg", (msg) => {
    console.log('msg', msg, 'from', socket.id);
    io.emit("rcv-msg", msg)
  })

  socket.on('disconnect', () => {
    console.log('a user disconnected');
  })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});