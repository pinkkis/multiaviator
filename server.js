const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let players = [];

class Player {
	constructor(clientId, name) {
		this.clientId = clientId;
		this.name = name || "frank";

		this.init();
	}

	init() {
		this.position = {
			x: -50,
			y: 15
		};
	}
}

function addPlayer(socket, name) {
	// add player to server player list
	players.push(new Player(socket.id));

	// push new player event to clients
	io.emit('addPlayer', socket.id, name);
}

function removePlayer(socket) {
	// remove player from server
	let clientId = socket.id;
	let playerIdx = players
		.map((e) => { return e.clientId; })
		.indexOf(socket.id);

	if (playerIdx > -1) {
		players.splice(playerIdx, 1);
	}

	// push player disconnection to clients
	io.emit('removePlayer', clientId);
}

app.use('/public', express.static(`${__dirname}/public`));
app.get("/", (request, response) => {
	response.sendFile(__dirname + '/views/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected', socket.id);

	socket.emit('connectionId', socket.id);

	players.forEach((player) => {
		socket.emit('addPlayer', player.clientId, player.name);
	});

	addPlayer(socket, "frank");

	socket.on('disconnect', () => {
		console.log('a user disconnected', socket.id);
		removePlayer(socket);
	});

	socket.on('positionUpdate', (position) => {
		socket.broadcast.emit('playerPositionUpdate', {
			clientId: socket.id,
			position: position
		});
	});

	socket.on('shootBullet', (payload) => {
		socket.broadcast.emit('shootBullet', payload);
	});
});

http.listen(process.env.PORT || 3000, () => {
	console.log(`listening on *:${process.env.PORT || 3000}`);
});