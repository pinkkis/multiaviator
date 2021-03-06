'use strict';

class Enemy {
	constructor(options) {
		this.alive = false;
		this.health = 0.0;
		this.position = {
			x: 0, y: 0, z: 0
		};
	}
	die() {
		this.alive = false;
		this.health = 0;
	}

	spawn(id) {
		this.id = id;
		this.health = 100;
		this.birthTime = Date.now();
		this.alive = true;
	}
}

module.exports = Enemy;