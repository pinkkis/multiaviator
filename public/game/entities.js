(() => {
	'use strict';
	window.game = window.game || {};

	let colors = new game.Colors();

	const bulletMaterial = new THREE.MeshBasicMaterial({ color: colors.Brown });
	const sphereGeometry = new THREE.SphereGeometry(5, 5, 3);
	const enemyGeometry = new THREE.TorusGeometry(20, 12, 7, 10);
	const enemyMaterial = new THREE.MeshStandardMaterial({
		color: 0x223322,
		metalness: 0.75,
		shading: THREE.FlatShading,
		roughness: 0.3
	});
	const groundMat = new THREE.MeshPhongMaterial({
		color: colors.Green,
		shading: THREE.FlatShading,
	});
	const mountainMat = new THREE.MeshLambertMaterial({
		color: colors.Grey,
		shading: THREE.FlatShading
	});
	const leavesMat = new THREE.MeshLambertMaterial({
		color: colors.Green,
		shading: THREE.FlatShading
	});

	const groundRadius = 3500;

	class AirPlane {
		constructor(options) {
			options = options || {};

			this.mesh = new THREE.Object3D();
			this.mesh.name = options.name || 'AirPlane';

			this.bodyMat = new THREE.MeshLambertMaterial({
				color: options.color || colors.Red,
				shading: THREE.FlatShading
			});

			this.metalMat = new THREE.MeshPhongMaterial({
				color: colors.Grey,
				shininess: 100
			});

			this.createCabin();
			this.createEngine();
			this.createPropeller();
			this.createTailplane();
			this.createWing();
		}

		createCabin () {
			let geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);

			geomCockpit.vertices[4].y-=10;
			geomCockpit.vertices[4].z+=10;
			geomCockpit.vertices[4].x-=20;
			geomCockpit.vertices[5].y-=10;
			geomCockpit.vertices[5].z-=10;
			geomCockpit.vertices[5].x-=20;
			geomCockpit.vertices[6].y+=10;
			geomCockpit.vertices[6].z+=20;
			geomCockpit.vertices[7].y+=10;
			geomCockpit.vertices[7].z-=20;

			let cockpit = new THREE.Mesh(geomCockpit, this.bodyMat);
			cockpit.castShadow = true;
			cockpit.receiveShadow = true;
			this.mesh.add(cockpit);
		}

		createEngine () {
			let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
			let engine = new THREE.Mesh(geomEngine, this.metalMat);

			engine.position.x = 40;
			engine.castShadow = true;
			engine.receiveShadow = true;
			this.mesh.add(engine);
		}

		createTailplane() {
			let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
			let tailPlane = new THREE.Mesh(geomTailPlane, this.bodyMat);
			tailPlane.position.set(-45, 25, 0);
			tailPlane.castShadow = true;
			tailPlane.receiveShadow = true;
			this.mesh.add(tailPlane);
		}

		createWing() {
			let geomSideWing = new THREE.BoxGeometry(40, 5, 120, 1, 1, 1);
			let sideWing = new THREE.Mesh(geomSideWing, this.bodyMat);
			sideWing.position.set(0, 10, 0);
			sideWing.castShadow = true;
			sideWing.receiveShadow = true;
			this.mesh.add(sideWing);
		}

		createPropeller() {
			let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
			this.propeller = new THREE.Mesh(geomPropeller, this.metalMat);
			this.propeller.castShadow = true;
			this.propeller.receiveShadow = true;

			let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
			let blade = new THREE.Mesh(geomBlade, this.metalMat);
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
			let cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
			let geom = new THREE.Geometry();

			let numClouds = 175;
			let stepAngle = Math.PI * 2 / numClouds;

			for (let i = 0; i < numClouds; i++) {
				let mesh = new Cloud({material: cloudMat}).mesh;
				let s = 1 + Math.random() * 5;
				let a = stepAngle * i;
				let h = groundRadius + 500 + Math.random() * 400;

				mesh.position.y = Math.sin(a) * h;
				mesh.position.x = Math.cos(a) * h;
				mesh.position.z = 100 - Math.random() * 1000;
				mesh.rotation.z = a + Math.PI / 2;
				mesh.scale.set(s, s, s);

				mesh.updateMatrix();
				geom.merge(mesh.geometry, mesh.matrix);
			}

			this.mesh = new THREE.Mesh(geom, cloudMat);
			this.mesh.name = 'Sky';
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
		}
	}

	class Cloud {
		constructor(options) {
			let geom = new THREE.Geometry();

			let nBlocs = 2 + Math.floor(Math.random() * 3);
			for (let i = 0; i < nBlocs; i++) {
				let mesh = new THREE.Mesh(sphereGeometry.clone(), options.material);
				let scale = 2 + Math.random() * 4;

				mesh.position.x = i * 25;
				mesh.position.y = Math.random() * 10;
				mesh.position.z = Math.random() * 10;
				mesh.rotation.z = Math.random() * Math.PI * 2;
				mesh.rotation.y = Math.random() * Math.PI * 2;
				mesh.scale.set(scale, scale, scale);

				mesh.updateMatrix();
				geom.merge(mesh.geometry, mesh.matrix);
			}

			this.mesh = new THREE.Mesh(geom, options.material);
			this.mesh.name = "cloud";
		}
	}

	class Ground {
		constructor(options) {
			let geom = new THREE.CylinderGeometry(groundRadius, groundRadius, 2500, 40, 1);
			geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

			this.mesh = new THREE.Mesh(geom, groundMat);
			this.mesh.receiveShadow = true;
			this.mesh.castShadow = true;

			this.createMountains({material: mountainMat});
			this.createForests({mat: leavesMat});
		}

		createForests(options) {
			let numObjs = 2000;
			let stepAngle = Math.PI * 2 / numObjs;

			let originals = [
				new Tree({mat: options.mat, numLeaves: 3}),
				new Tree({mat: options.mat, numLeaves: 4}),
				new Tree({mat: options.mat, numLeaves: 5})
			];

			let treesGeom = new THREE.Geometry();

			for (let i = 0; i < numObjs; i++) {
				let cloneObj = originals[i%originals.length].mesh.clone();

				let angle = stepAngle * i;
				let height = groundRadius - 5;
				let scale = (0.75 + Math.random() * 0.5) * 0.5;

				cloneObj.position.y = Math.sin(angle) * height;
				cloneObj.position.x = Math.cos(angle) * height;
				cloneObj.position.z = 100 - Math.random() * 1000;
				cloneObj.rotation.z = angle - Math.PI / 2;
				cloneObj.scale.set(scale, scale, scale);

				cloneObj.updateMatrix();
				treesGeom.merge(cloneObj.geometry, cloneObj.matrix);
			}

			let forest = new THREE.Mesh(treesGeom, options.mat);
			forest.castShadow = true;
			forest.receiveShadow = true;

			this.mesh.add(forest);

			originals = undefined;
		}

		createMountains(options) {
			let numObjs = 27;
			let stepAngle = Math.PI * 2 / numObjs;

			let originals = [
				new Mountain({extraRadius: 200, material: options.material}),
				new Mountain({extraRadius: 400, material: options.material}),
				new Mountain({extraRadius: 600, material: options.material})
			];

			let mountainsGeom = new THREE.Geometry();

			for (let i = 0; i < numObjs; i++) {
				let cloneObj = originals[i%originals.length].mesh.clone();

				let angle = stepAngle * i;
				let height = groundRadius;
				let scale = (0.8 + Math.random() * 0.5);

				cloneObj.position.y = Math.sin(angle) * height;
				cloneObj.position.x = Math.cos(angle) * height;
				cloneObj.position.z = -1500 - Math.random() * 2000;
				cloneObj.rotation.z = angle - Math.PI / 2;
				cloneObj.scale.set(scale, scale, scale);

				cloneObj.updateMatrix();
				mountainsGeom.merge(cloneObj.geometry, cloneObj.matrix);
			}

			let mountains = new THREE.Mesh(mountainsGeom, options.material);
			mountains.castShadow = true;
			mountains.receiveShadow = true;
			this.mesh.add(mountains);

			originals = undefined;
		}
	}

	class Mountain {
		constructor(options) {
			let geom = new THREE.ConeGeometry(500 + options.extraRadius, 1000, 4);
			this.mesh = new THREE.Mesh(geom, options.material);
			this.mesh.name = 'Mountain';
		}
	}

	class Tree {
		constructor(options) {
			let geom = new THREE.Geometry();

			let trunk = this.createTrunk(options);
			let leaves = this.createLeaves(options);

			geom.merge(trunk.geometry, trunk.matrix);
			geom.merge(leaves.geometry, leaves.matrix);

			this.mesh = new THREE.Mesh(geom, options.mat);
			this.mesh.name = 'Tree';

			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
		}

		createTrunk (options) {
			options = options || {};

			let geomTrunk = new THREE.CylinderGeometry(15, 15, 50, 3);
			let trunk = new THREE.Mesh(geomTrunk, options.mat);

			trunk.castShadow = false;
			trunk.receiveShadow = true;

			return trunk;
		}

		createLeaves (options) {
			options = options || {};
			options.numLeaves = options.numLeaves || 1;

			let leaves = new THREE.Geometry();
			let coneGeom = new THREE.ConeGeometry(50, 100, 5);

			for (let i = 1; i < options.numLeaves + 1; i++) {
				let mesh = new THREE.Mesh(coneGeom.clone());
				mesh.position.y = 25 + (i * 35 * (1 - i/15));
				mesh.rotation.z = Math.random() * 0.2;
				mesh.rotation.y = Math.random() * Math.PI * 2;

				let scale = 1 - (i/6);
				mesh.scale.set(scale, scale, scale);

				mesh.updateMatrix();
				leaves.merge(mesh.geometry, mesh.matrix);
			}

			let leavesMesh = new THREE.Mesh(leaves, options.mat);

			leavesMesh.castShadow = true;
			leavesMesh.receiveShadow = true;

			return leavesMesh;
		}
	}

	class Bullet {
		constructor(options) {
			this.mesh = new THREE.Mesh(sphereGeometry, bulletMaterial);
			this.mesh.name = "bullet";
			this.mesh.receiveShadow = false;
			this.mesh.castShadow = true;

			this.mesh.position.z = 200;
			this.mesh.scale.set(0.8, 0.8, 0.8);

			this.birthTime = null;
			this.alive = false;
			this.direction = new THREE.Vector3();
			this.velocity = new THREE.Vector3();
		}

		die() {
			this.alive = false;
		}

		spawn(shooter) {
			this.owner = shooter || null;
			this.birthTime = performance.now();
			this.alive = true;
		}
	}

	class Enemy {
		constructor(options) {
			this.id = 0;
			this.mesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
			this.mesh.name = "enemy";
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = false;

			this.mesh.position.z = 200;

			this.birthTime = null;
			this.alive = false;

			this.lastNetPosition = {x: 0, y: 0};
		}

		die() {
			this.alive = false;
			this.id = 0;
		}

		spawn() {
			this.birthTime = Date.now();
			this.alive = true;
		}

		get color() {
			return 0x000000;
		}
	}

	game.entities = {
		AirPlane: AirPlane,
		Ground: Ground,
		Enemy: Enemy,
		Bullet: Bullet,
		Sky: Sky
	};

})();