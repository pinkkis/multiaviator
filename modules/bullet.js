'use strict';

class Bullet {
	constructor(options) {
		this.alive = false;
		this.position = {
			x: 0, y: 0, z: 0
		};
	}

	die() {
		this.alive = false;
	}

	spawn(shooter) {
		this.owner = shooter || null;
		this.birthTime = Date.now();
		this.alive = true;
	}
}

module.exports = Bullet;