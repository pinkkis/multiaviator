(() => {
	'use strict';
	window.game = window.game || {};

	let colors = new game.Colors();

	const groundRadius = 3500;

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
			let matCockpit = new THREE.MeshLambertMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let cockpit = new THREE.Mesh(geomCockpit, matCockpit);
			cockpit.castShadow = true;
			cockpit.receiveShadow = true;
			this.mesh.add(cockpit);
		}

		createEngine (options) {
			options = options || {};

			let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
			let matEngine = new THREE.MeshPhongMaterial({
				color: colors.LightGrey,
				shininess: 100
			});
			let engine = new THREE.Mesh(geomEngine, matEngine);
			engine.position.x = 40;
			engine.castShadow = true;
			engine.receiveShadow = true;
			this.mesh.add(engine);
		}

		createTailplane(options) {
			options = options || {};

			let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
			let matTailPlane = new THREE.MeshLambertMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
			tailPlane.position.set(-35, 25, 0);
			tailPlane.castShadow = true;
			tailPlane.receiveShadow = true;
			this.mesh.add(tailPlane);
		}

		createWing(options) {
			options = options || {};

			let geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
			let matSideWing = new THREE.MeshLambertMaterial({ color: options.color || colors.Red, shading: THREE.FlatShading });
			let sideWing = new THREE.Mesh(geomSideWing, matSideWing);
			sideWing.position.set(0, 0, 0);
			sideWing.castShadow = true;
			sideWing.receiveShadow = true;
			this.mesh.add(sideWing);
		}

		createPropeller(options) {
			options = options || {};

			let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
			let matPropeller = new THREE.MeshPhongMaterial({
				color: colors.Brown,
				shininess: 100
			});
			this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
			this.propeller.castShadow = true;
			this.propeller.receiveShadow = true;

			let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
			let matBlade = new THREE.MeshPhongMaterial({
				color: colors.Brown,
				shininess: 100
			});
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
			this.nClouds = 100;
			this.clouds = [];
			let stepAngle = Math.PI * 2 / this.nClouds;
			for (let i = 0; i < this.nClouds; i++) {
				let c = new Cloud();
				this.clouds.push(c);
				let a = stepAngle * i;
				let h = groundRadius + 500 + Math.random() * 400;
				c.mesh.position.y = Math.sin(a) * h;
				c.mesh.position.x = Math.cos(a) * h;
				c.mesh.position.z = 100 - Math.random() * 1000;
				c.mesh.rotation.z = a + Math.PI / 2;
				let s = 1 + Math.random() * 5;
				c.mesh.scale.set(s, s, s);
				this.mesh.add(c.mesh);
			}
		}
	}

	class Ground {
		constructor(options) {
			let geom = new THREE.CylinderGeometry(groundRadius, groundRadius, 2500, 50, 20);
			let mat = new THREE.MeshPhongMaterial({
				color: colors.Green,
				shading: THREE.FlatShading,
			});

			geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

			this.mesh = new THREE.Mesh(geom, mat);
			this.mesh.receiveShadow = true;
			this.mesh.castShadow = true;

			this.createMountains();
			this.createForests();
		}

		createForests() {
			this.numObjs = 700;
			this.trees = [];
			let stepAngle = Math.PI * 2 / this.numObjs;
			for (let i = 0; i < this.numObjs; i++) {
				let c = new Tree();
				this.obsj.push(c);
				let a = stepAngle * i;
				let h = groundRadius;
				c.mesh.position.y = Math.sin(a) * h;
				c.mesh.position.x = Math.cos(a) * h;
				c.mesh.position.z = 100 - Math.random() * 1000;
				c.mesh.rotation.z = a - Math.PI / 2;
				let s = (0.5 + Math.random()) * 0.3;
				c.mesh.scale.set(s, s, s);
				this.mesh.add(c.mesh);
			}
		}

		createMountains() {
			this.numObjs = 25;
			this.obsj = [];
			let stepAngle = Math.PI * 2 / this.numObjs;
			for (let i = 0; i < this.numObjs; i++) {
				let c = new Mountain();
				this.obsj.push(c);
				let a = stepAngle * i;
				let h = groundRadius + 300;
				c.mesh.position.y = Math.sin(a) * h;
				c.mesh.position.x = Math.cos(a) * h;
				c.mesh.position.z = -1500 - Math.random() * 2000;
				c.mesh.rotation.z = a - Math.PI / 2;
				let s = (0.8 + Math.random() * 0.5);
				c.mesh.scale.set(s, s, s);
				this.mesh.add(c.mesh);
			}
		}
	}

	class Cloud {
		constructor(options) {
			this.mesh = new THREE.Object3D();
			this.mesh.name = "cloud";

			let geom = new THREE.SphereBufferGeometry(20, 5, 3);
			let mat = new THREE.MeshBasicMaterial({
				color: 0xffffff
			});

			let nBlocs = 2 + Math.floor(Math.random() * 2);
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
			let geom = new THREE.CylinderBufferGeometry(2, 2, 4, 5, 2);
			let mat = new THREE.MeshBasicMaterial({
				color: colors.Brown,
			});

			geom.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI / 2));

			this.mesh = new THREE.Mesh(geom, mat);
			this.mesh.name = "bullet";
			this.mesh.receiveShadow = false;
			this.mesh.castShadow = true;
		}
	}

	class Mountain {
		constructor(options) {
			let geom = new THREE.ConeBufferGeometry(500 + Math.random() * 500, 1000, 4);
			let mat = new THREE.MeshLambertMaterial({
				color: colors.Grey,
				shading: THREE.FlatShading
			});
			this.mesh = new THREE.Mesh(geom, mat);
			this.mesh.name = "mountain";
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
		}
	}

	class Tree {
		constructor(options) {
			this.mesh = new THREE.Object3D();
			this.mesh.name = "tree";

			this.createTrunk(options);
			this.createLeaves(options);
		}

		createTrunk (options) {
			options = options || {};

			let geomTrunk = new THREE.CylinderBufferGeometry(15, 15, 50, 3);
			let matTrunk = new THREE.MeshLambertMaterial({
				color: colors.Brown,
				shading: THREE.FlatShading
			});
			let trunk = new THREE.Mesh(geomTrunk, matTrunk);

			trunk.castShadow = true;
			trunk.receiveShadow = true;

			this.mesh.add(trunk);
		}

		createLeaves (options) {
			options = options || {};

			let geom = new THREE.ConeBufferGeometry(50, 100, 5);
			let mat = new THREE.MeshLambertMaterial({
				color: colors.Green,
				shading: THREE.FlatShading
			});

			let nBlocs = 2 + Math.floor(Math.random() * 2);
			for (let i = 1; i < nBlocs + 1; i++) {
				let mesh = new THREE.Mesh(geom.clone(), mat);
				mesh.position.y = 25 + (i * 35);
				mesh.rotation.z = Math.random() * 0.2;
				mesh.rotation.y = Math.random() * Math.PI * 2;

				let scale = 1 - (i/8);
				mesh.scale.set(scale, scale, scale);

				mesh.castShadow = true;
				mesh.receiveShadow = true;

				this.mesh.add(mesh);
			}
		}
	}

	class Enemy {

	}

	game.entities = {
		AirPlane: AirPlane,
		Ground: Ground,
		Enemy: Enemy,
		Bullet: Bullet,
		Sky: Sky
	};

})();