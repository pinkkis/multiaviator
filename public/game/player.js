(() => {
	'use strict';
	window.game = window.game || {};

	class Player {
		constructor(clientId, name) {
			this.clientId = clientId;
			this.name = name || "frank";

			this.init();
		}

		init() {
			this.model = null;
			this.lastNetPosition = {
				x: 0, y: 0
			};
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