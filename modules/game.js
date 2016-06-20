'use strict';
const socket = require('socket.io');
const Player = require('./player');
const Bullet = require('./bullet');
const Enemy = require('./enemy');

const initiator = require('./initGameObjects');

let tempGameOptions = {
	enemySpawnRate: 3000,
	enemyLifetime: 10000
};

let tempGameState = {
	lastEnemySpawned: 0
};

class Game {
	constructor(io, options) {
		this.io = io;
		this.options = options || {};
		this.serverTickId = null;
		this.clients = [];
		this.players = [];
		this.enemies = [];
		this.bullets = [];

		this.serverTimer = {
			oldTime: Date.now(),
			delta: 0
		};

		this.init();
	}

	init() {
		this.io.on('connection', socket => {
			this.onClientConnected(socket);
		});

		this.io.on('error', error => {
			console.error(`socket.io error -> `, error);
		});
	}

	startServerTick() {
		this.serverTickId = setInterval(() => {
			this.serverTick();
		}, 100);
	}

	stopServerTick() {
		clearInterval(this.serverTickId);
		this.serverTickId = null;
	}

	serverTick() {
		this.spawnEnemies();
		this.updateEntities();
	}

	resetGameState() {
		// do nothing
	}

	updateEntities() {
		var now = Date.now();

		// update bullets

		// update enemies
		this.enemies.forEach((enemy) => {
			if (enemy.birthTime + tempGameOptions.enemyLifetime < now) {
				enemy.die();
			}
		});

		// collision check

		// update entity lists
		this.enemies = this.enemies.filter((e) => { return e.alive; });

		// update clients
		this.io.emit('enemyUpdate', this.enemies);
	}

	spawnEnemies() {
		// if time to spawn, spawn an enemy
		let now = Date.now();

		if (now > tempGameState.lastEnemySpawned + tempGameOptions.enemySpawnRate / (this.players.length / 2)) {
			tempGameState.lastEnemySpawned = now;

			let enemy = new Enemy();
			enemy.position = {
				x: 250 + Math.floor(Math.random() * 100),
				y: Math.floor(Math.random() * 250),
				z: 200
			};

			this.enemies.push(enemy);
			enemy.spawn(now);
		}
	}

	onClientConnected(socket) {
		if (this.serverTickId === null) {
			this.startServerTick();
		}

		console.log(`Client ${socket.id} connected`);

		// add to clients
		this.clients.push(socket);

		// send the client back it's connection id
		socket.emit('connectionId', socket.id);

		this.players.forEach((player) => {
			socket.emit('addPlayer', player.toJSON());
		});

		socket.on('disconnect', () => {
			this.onClientDisconnected(socket);
		});

		socket.on('positionUpdate', (position) => {
			this.onPlayerPositionUpdate(socket, position);
		});

		socket.on('shootBullet', (payload) => {
			this.onShootBullet(socket, payload);
		});

		socket.on('joinRequest', (payload) => {
			this.onJoinRequest(socket, payload);
		});

		socket.on('chatMessage', (message) => {
			this.onChatMessage(socket, message);
		});

		socket.on('error', (error) => {
			console.error(`encountered error`, error);
		});
	}

	onChatMessage(socket, message) {
		let player = this.getObjectByKeyValue(this.players, 'clientId', socket.id);

		if (player) {
			let strippedMessage = message.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 50);
			this.io.emit('chatMessage', player.name, strippedMessage);
		}
	}

	onClientDisconnected(socket) {
		console.log('a user disconnected', socket.id);
		this.removePlayer(socket);
		this.removeClient(socket);

		if (!this.clients.length) {
			this.resetGameState();
			this.stopServerTick();
		}
	}

	onPlayerPositionUpdate(socket, position) {
		socket.broadcast.emit('playerPositionUpdate', {
			clientId: socket.id,
			position: position
		});

		let player = this.getObjectByKeyValue(this.players, 'clientId', socket.id);
		if (!player) return;

		player.position = position;
	}

	onShootBullet(socket, payload) {
		payload.shooter = socket.id;
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
		// remove player from players
		let clientId = socket.id;
		let playerIdx = this.players
			.map((e) => { return e.clientId; })
			.indexOf(clientId);

		if (playerIdx > -1) {
			this.players.splice(playerIdx, 1);
		}

		// push player disconnection to clients
		this.io.emit('removePlayer', clientId);
	}

	removeClient(socket) {
		let cId = socket.id;
		let clientIdx = this.clients
			.map((e) => { return e.clientId; })
			.indexOf(cId);

		if (clientIdx > -1) {
			this.clients.splice(clientIdx, 1);
		}
	}

	getObjectByKeyValue(array, key, value) {
		let objId = array
			.map((e) => { return e[key]; })
			.indexOf(value);

		return objId > -1 ? array[objId] : null;
	}
}

module.exports = Game;
