'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const Player = require('./modules/player');
const Game = require('./modules/game');

/////////////////////////////////////////////

const game = new Game(io, {});

app.use('/public', express.static(`${__dirname}/public`));
app.get("/", (request, response) => {
	response.sendFile(__dirname + '/views/index.html');
});

http.listen(process.env.PORT || 3000, () => {
	console.log(`listening on *:${process.env.PORT || 3000}`);
});