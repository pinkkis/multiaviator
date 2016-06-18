(() => {
	'use strict';
	window.game = window.game || {};

	class Network {
		constructor(params) {
			this.socket = window.io();

			this.clientId = null;

			this.socket.on('connectionId', (connId) => {
				console.log(`connectionId received ${connId}`);
				this.clientId = connId;
			});
		}



	}



	window.game.Network = Network;
})();