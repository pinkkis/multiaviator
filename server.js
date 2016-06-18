const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', (socket) => {
    console.log('a user disconnected');
  });
});

http.listen(process.env.PORT, () => {
  console.log(`listening on *:${process.env.PORT}`);
});