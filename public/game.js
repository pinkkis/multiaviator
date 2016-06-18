(() => {
	'use strict';

	window.game = window.game || {};
	window.addEventListener('load', init, false);
	window.addEventListener('resize', handleWindowResize, false);

	const groundRadius = 3500;
	const gameSpeed = 0.2;

	let scene,
		deltaTime = 0,
		oldTime = performance.now(),
		newTime = performance.now(),
		players = [],
		enemies = [],
		bullets = [],
		camera, fieldOfView, aspectRatio, nearPlane, farPlane,
		renderer, container,
		HEIGHT, WIDTH,
		mousePos = { x: 0, y: 0 },
		sky, airplane, ground,
		ambientLight, hemisphereLight, shadowLight,
		colors = new game.Colors(),
		network = new game.Network(),
		stats = new Stats();


	//INIT THREE JS, SCREEN AND MOUSE EVENTS
	function clampedAspectRatio(height, width) {
		let ratio = height / width;

		return ratio > 3 ? 3
				: ratio < 1.1 ? 1.1 : ratio;
	}

	function createScene() {
		HEIGHT = window.innerHeight;
		WIDTH = window.innerWidth;

		scene = new THREE.Scene();
		aspectRatio = clampedAspectRatio(WIDTH, HEIGHT);
		fieldOfView = 50;
		nearPlane = 1;
		farPlane = 10000;
		camera = new THREE.PerspectiveCamera(
			fieldOfView,
			aspectRatio,
			nearPlane,
			farPlane
		);

		scene.fog = new THREE.FogExp2(0xaaaaaa, 0.0003);

		camera.position.x = 0;
		camera.position.z = 800;
		camera.position.y = 15;

		camera.rotation.x = -25;

		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setSize(WIDTH, HEIGHT);
		renderer.shadowMap.enabled = true;

		container = document.getElementById('world');
		container.appendChild(renderer.domElement);

	}

	// HANDLE SCREEN EVENTS
	function handleWindowResize() {
		HEIGHT = window.innerHeight;
		WIDTH = window.innerWidth;
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = clampedAspectRatio(WIDTH, HEIGHT);
		camera.updateProjectionMatrix();
	}

	// LIGHTS
	function createLights() {
		hemisphereLight = new THREE.HemisphereLight(colors.White, 0x333333, 0.85);
		shadowLight = new THREE.DirectionalLight(0xffffcc, 1);

		shadowLight.position.set(150, 1000, 250);
		shadowLight.castShadow = true;

		shadowLight.shadow.camera.left = -600;
		shadowLight.shadow.camera.right = 600;
		shadowLight.shadow.camera.top = 1200;
		shadowLight.shadow.camera.bottom = -600;
		shadowLight.shadow.camera.near = 1;
		shadowLight.shadow.camera.far = 1500;
		shadowLight.shadow.mapSize.width = 2048;
		shadowLight.shadow.mapSize.height = 2048;

		scene.add(hemisphereLight);
		scene.add(shadowLight);
	}

	// 3D Models
	function createPlayerPlane() {
		airplane = new game.entities.AirPlane();
		airplane.mesh.scale.set(0.25, 0.25, 0.25);
		airplane.mesh.position.y = 100;
		airplane.mesh.position.z = 200;
		scene.add(airplane.mesh);
	}

	function createOtherPlayerPlane() {
		let airplane = new game.entities.AirPlane({ color: colors.RandomPlayerColor });
		airplane.mesh.scale.set(0.25, 0.25, 0.25);
		airplane.mesh.position.y = 100;
		airplane.mesh.position.z = 200;

		return airplane;
	}

	function createGround() {
		ground = new game.entities.Ground();
		ground.mesh.position.y = -groundRadius -100;

		scene.add(ground.mesh);
	}

	function createSky() {
		sky = new game.entities.Sky();
		sky.mesh.position.y = -groundRadius - 200;
		scene.add(sky.mesh);
	}

	function loop() {
		stats.begin();

		newTime = performance.now();
		deltaTime = newTime-oldTime;
		oldTime = newTime;

		updatePlayerPlane();
		updateOtherPlayerPlanes();
		ground.mesh.rotation.z += deltaTime * gameSpeed * 0.0001;
		sky.mesh.rotation.z += deltaTime * gameSpeed * 0.0002;
		renderer.render(scene, camera);
		stats.end();
		requestAnimationFrame(loop);
	}

	function updateOtherPlayerPlanes() {
		players.forEach((player) => {
			tweenPositionToTarget(player.model.mesh, player.lastNetPosition.x, player.lastNetPosition.y);
			player.model.propeller.rotation.x += deltaTime * 0.05;

		});
	}

	function updatePlayerPlane() {
		var targetY = normalize(mousePos.y, -0.75, 0.75, -50, 330);
		var targetX = normalize(mousePos.x, -0.75, 0.75, -300, 300);

		tweenPositionToTarget(airplane.mesh, targetX, targetY);

		airplane.propeller.rotation.x += deltaTime * 0.05;
	}

	function tweenPositionToTarget(mesh, targetX, targetY) {
		// Move the plane at each frame by adding a fraction of the remaining distance
		mesh.position.x += (targetX - mesh.position.x) * deltaTime * 0.0075;
		mesh.position.y += (targetY - mesh.position.y) * deltaTime * 0.0075;

		// Rotate the plane proportionally to the remaining distance
		mesh.rotation.z = (targetY - mesh.position.y) * deltaTime * 0.0005;
		mesh.rotation.x = (mesh.position.y - targetY) * deltaTime * 0.0005;
	}

	function addPlayer(clientId, name) {
		console.log('addPlayer', clientId);

		let player = new game.Player(clientId, name);
		player.model = createOtherPlayerPlane();

		scene.add(player.model.mesh);
		players.push(player);
	}

	function removePlayer(clientId) {
		console.log('removePlayer', clientId);

		let playerIdx = players
			.map((e) => { return e.clientId; })
			.indexOf(clientId);

		if (playerIdx > -1) {
			scene.remove(players[playerIdx].model.mesh);
			players.splice(playerIdx, 1);
		}
	}

	function findPlayerByClientId(clientId) {
		let playerIdx = players
			.map((e) => { return e.clientId; })
			.indexOf(clientId);

		return playerIdx > -1 ? players[playerIdx] : null;
	}

	function initNetworkEvents() {
		network.socket.on('addPlayer', (clientId) => {
			// check that it's not own id
			if (clientId !== network.clientId) {
				addPlayer(clientId);
			}
		});

		network.socket.on('removePlayer', (clientId) => {
			if (clientId !== network.clientId) {
				removePlayer(clientId);
			}
		});

		network.socket.on('disconnect', () => {
			players.forEach((player) => {
				removePlayer(player.clientId);
			});
		});

		network.socket.on('playerPositionUpdate', (payload) => {
			if (payload.clientId !== network.clientId) {
				let player = findPlayerByClientId(payload.clientId);
				console.log(player);
				player.lastNetPosition = payload.position;
			}
		});
	}

	function throttle(fn, threshhold, scope) {
		threshhold || (threshhold = 250);
		var last,
			deferTimer;
		return function () {
			var context = scope || this;

			var now = +new Date,
				args = arguments;
			if (last && now < last + threshhold) {
				// hold on to it
				clearTimeout(deferTimer);
				deferTimer = setTimeout(function () {
					last = now;
					fn.apply(context, args);
				}, threshhold);
			} else {
				last = now;
				fn.apply(context, args);
			}
		};
	}

	function normalize(v, vmin, vmax, tmin, tmax) {
		var nv = Math.max(Math.min(v, vmax), vmin);
		var dv = vmax - vmin;
		var pc = (nv - vmin) / dv;
		var dt = tmax - tmin;
		var tv = tmin + (pc * dt);
		return tv;
	}

	function init(event) {
		stats.showPanel(1);
		document.body.appendChild(stats.dom);
		document.addEventListener('mousemove', handleMouseMove, false);

		initNetworkEvents();

		createScene();
		createLights();
		createPlayerPlane();
		createGround();
		createSky();
		loop();
	}

	// HANDLE MOUSE EVENTS
	function handleMouseMove(event) {
		var tx = -1 + (event.clientX / WIDTH) * 2;
		var ty = 1 - (event.clientY / HEIGHT) * 2;
		mousePos = { x: tx, y: ty };
		throttledPositionUpdate();
	}

	var throttledPositionUpdate = throttle(() => {
		var translatedY = normalize(mousePos.y, -0.75, 0.75, -50, 220);
		var translatedX = normalize(mousePos.x, -0.75, 0.75, -300, 300);

		network.socket.emit('positionUpdate', {x: translatedX, y: translatedY});
	}, 50);

})();


