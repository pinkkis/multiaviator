(() => {
	'use strict';
	window.game = window.game || {};

	let colors = new game.Colors();

	class AirPlane {
		constructor(options) {
			this.mesh = new THREE.Object3D();
			this.mesh.name = "airPlane";

			this.createCabin(options);
			this.createEngine(options);
			this.createPropeller(options);
			this.createTailplane(options);
			this.createWing(options);
		}

		createCabin (options) {
			options = options || {};

			let geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
			let matCockpit = new THREE.MeshPhongMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let cockpit = new THREE.Mesh(geomCockpit, matCockpit);
			cockpit.castShadow = true;
			cockpit.receiveShadow = true;
			this.mesh.add(cockpit);
		}

		createEngine (options) {
			options = options || {};

			let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
			let matEngine = new THREE.MeshPhongMaterial({ color: colors.White, shading: THREE.FlatShading });
			let engine = new THREE.Mesh(geomEngine, matEngine);
			engine.position.x = 40;
			engine.castShadow = true;
			engine.receiveShadow = true;
			this.mesh.add(engine);
		}

		createTailplane(options) {
			options = options || {};

			let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
			let matTailPlane = new THREE.MeshPhongMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
			tailPlane.position.set(-35, 25, 0);
			tailPlane.castShadow = true;
			tailPlane.receiveShadow = true;
			this.mesh.add(tailPlane);
		}

		createWing(options) {
			options = options || {};

			let geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
			let matSideWing = new THREE.MeshPhongMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let sideWing = new THREE.Mesh(geomSideWing, matSideWing);
			sideWing.position.set(0, 0, 0);
			sideWing.castShadow = true;
			sideWing.receiveShadow = true;
			this.mesh.add(sideWing);
		}

		createPropeller(options) {
			options = options || {};

			let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
			let matPropeller = new THREE.MeshPhongMaterial({ color: colors.Brown, shading: THREE.FlatShading });
			this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
			this.propeller.castShadow = true;
			this.propeller.receiveShadow = true;

			let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
			let matBlade = new THREE.MeshPhongMaterial({ color: colors.BrownDark, shading: THREE.FlatShading });
			let blade = new THREE.Mesh(geomBlade, matBlade);
			blade.position.set(8, 0, 0);
			blade.castShadow = true;
			blade.receiveShadow = true;
			this.propeller.add(blade);
			this.propeller.position.set(50, 0, 0);
			this.mesh.add(this.propeller);
		}

	}

	class Sky {
		constructor(options) {
			this.mesh = new THREE.Object3D();
			this.nClouds = 50;
			this.clouds = [];
			let stepAngle = Math.PI * 2 / this.nClouds;
			for (let i = 0; i < this.nClouds; i++) {
				let c = new Cloud();
				this.clouds.push(c);
				let a = stepAngle * i;
				let h = 2900 + Math.random() * 600;
				c.mesh.position.y = Math.sin(a) * h;
				c.mesh.position.x = Math.cos(a) * h;
				c.mesh.position.z = 100 - Math.random() * 600;
				c.mesh.rotation.z = a + Math.PI / 2;
				let s = 1 + Math.random() * 3;
				c.mesh.scale.set(s, s, s);
				this.mesh.add(c.mesh);
			}
		}
	}

	class Ground {
		constructor(options) {
			let geom = new THREE.CylinderGeometry(2500, 2500, 2600, 50, 20);
			let mat = new THREE.MeshPhongMaterial({
				color: colors.Green,
				shading: THREE.FlatShading,
			});

			geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

			this.mesh = new THREE.Mesh(geom, mat);
			this.mesh.receiveShadow = true;
		}
	}

	class Cloud {
		constructor(options) {
			this.mesh = new THREE.Object3D();
			this.mesh.name = "cloud";

			let geom = new THREE.SphereGeometry(20, 5, 3);
			let mat = new THREE.MeshPhongMaterial({
				color: colors.White
			});

			let nBlocs = 3 + Math.floor(Math.random() * 3);
			for (let i = 0; i < nBlocs; i++) {
				let mesh = new THREE.Mesh(geom.clone(), mat);
				mesh.position.x = i * 25;
				mesh.position.y = Math.random() * 10;
				mesh.position.z = Math.random() * 10;
				mesh.rotation.z = Math.random() * Math.PI * 2;
				mesh.rotation.y = Math.random() * Math.PI * 2;

				let scale = 0.6 + Math.random() * 0.9;
				mesh.scale.set(scale, scale, scale);
				mesh.castShadow = true;
				mesh.receiveShadow = true;

				this.mesh.add(mesh);
			}
		}
	}

	class Bullet {
		constructor(options) {
			let geom = new THREE.CylinderGeometry(2, 2, 4, 5, 2);
			let mat = new THREE.MeshPhongMaterial({
				color: colors.Brown,
				shading: THREE.FlatShading,
			});

			geom.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI / 2));

			this.mesh = new THREE.Mesh(geom, mat);
			this.mesh.receiveShadow = false;
			this.mesh.castShadow = true;
		}
	}

	class Tree {

	}

	class Enemy {

	}

	game.entities = {
		AirPlane: AirPlane,
		Ground: Ground,
		Cloud: Cloud,
		Enemy: Enemy,
		Tree: Tree,
		Bullet: Bullet,
		Sky: Sky
	};

})();