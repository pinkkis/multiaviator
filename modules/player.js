'use strict';

class Player {
	constructor(clientId, gameOptions) {
		if (!clientId) throw new Error('ClientID must be passed to create a new Player');

		this.clientId = clientId;
		this.gameOptions = gameOptions || {};
		this.init();
	}

	init() {
		this._position = {
			x: 0,
			y: 0,
			z: 0,
		};

		this.alive = false;
		this.color = 0xffffff;
		this.name = "Anonymous";
	}

	get position() {
		return [this._position.x, this._position.y, this._position.z];
	}

	set position(value) {
		if (!value) {return false;}
		this._position.x = value.x;
		this._position.y = value.y;
		this._position.z = value.z;
	}

	spawn() {
		this.created = Date.now();
		this.alive = true;
		this.health = this.gameOptions.playerStartHealth || 100.0;
	}

	die() {
		this.alive = false;
		this.health = 0.0;
	}

	tick() {
		if (this.health < 0) {
			this.die();
		}
	}

	toJSON() {
		return {
			"clientId": this.clientId,
			"name": this.name,
			"color": this.color,
			"position": this.position,
			"alive": this.alive,
			"health": this.health
		};
	}
}


module.exports = Player;