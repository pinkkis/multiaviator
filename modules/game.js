'use strict';
const socket = require('socket.io');
const Player = require('./player');

class Game {
	constructor(io, options) {
		this.io = io;
		this.options = options || {};
		this.init();
	}

	init() {
		this.clients = [];
		this.players = [];
		this.enemies = [];
		this.bullets = [];

		this.io.on('connection', socket => {
			this.onClientConnected(socket);
		});
	}

	onClientConnected(socket) {
		console.log(`Client ${socket.id} connected`);

		// send the client back it's connection id
		socket.emit('connectionId', socket.id);

		this.players.forEach((player) => {
			socket.emit('addPlayer', player.toJSON());
		});

		socket.on('disconnect', () => {
			this.onClientDisconnected(socket);
		});

		socket.on('positionUpdate', (position) => {
			this.onPositionUpdate(socket, position);
		});

		socket.on('shootBullet', (payload) => {
			this.onShootBullet(socket, payload);
		});

		socket.on('joinRequest', (payload) => {
			this.onJoinRequest(socket, payload);
		});
	}

	onClientDisconnected(socket) {
		console.log('a user disconnected', socket.id);
		this.removePlayer(socket);
	}

	onPositionUpdate(socket, position) {
		socket.broadcast.emit('playerPositionUpdate', {
			clientId: socket.id,
			position: position
		});

		let player = this.getPlayerById(socket.id);
		if (!player) return;

		player.position = position;
	}

	onShootBullet(socket, payload) {
		socket.broadcast.emit('shootBullet', payload);
	}

	onJoinRequest(socket, payload) {
		let newPlayer = this.addPlayer(socket, payload);
		socket.emit('joinGame', newPlayer);
		console.log(`${newPlayer.name} joined the game from ${newPlayer.clientId}`);
	}

	addPlayer(socket, payload) {
		let player = new Player(socket.id, this.options);
		player.name = payload.name;
		player.color = `0x${payload.color.toString(16)}`;

		player.spawn();

		this.players.push(player);

		// push new player event to clients
		socket.broadcast.emit('addPlayer', player.toJSON());

		return player;
	}

	removePlayer(socket) {
		// remove player from server
		let clientId = socket.id;
		let playerIdx = this.players
			.map((e) => { return e.clientId; })
			.indexOf(socket.id);

		if (playerIdx > -1) {
			this.players.splice(playerIdx, 1);
		}

		// push player disconnection to clients
		this.io.emit('removePlayer', clientId);
	}

	getPlayerById(clientId) {
		let playerIdx = this.players
			.map((e) => { return e.clientId; })
			.indexOf(socket.id);

		return playerIdx > -1 ? this.players[playerIdx] : null;
	}
}

module.exports = Game;
