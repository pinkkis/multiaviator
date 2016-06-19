(() => {
	'use strict';
	window.game = window.game || {};

	class Player {
		constructor(player) {
			this.clientId = player.clientId;
			this.name = player.name;
			this.color = parseInt(player.color);
			this.health = player.health;
			this.alive = player.alive;
			this.init();
			this._serverPosition = null;
			this.lastNetPosition = player.position || [0, 0, 0];
		}

		init() {
			this.model = null;
		}

		get lastNetPosition() {
			return this._serverPosition;
		}

		set lastNetPosition(position) {
			if (Array.isArray(position)) {
				this._serverPosition = {
					x: position[0],
					y: position[1],
					z: position[2]
				};

				return;
			}

			this._serverPosition = position;
		}

		getPosition() {
			if (this.model === null) {
				return 'undefined';
			}

			return this.model.mesh.position;
		}
	}

	window.game.Player = Player;
})();