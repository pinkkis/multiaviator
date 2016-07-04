(() => {
	'use strict';

	window.game = window.game || {};
	window.addEventListener('load', init, false);
	window.addEventListener('resize', handleWindowResize, false);

	const Text2D = THREE_Text.Text2D;
	const SpriteText2D = THREE_Text.SpriteText2D;
	const textAlign = THREE_Text.textAlign;

	const groundRadius = 3500;
	const gameSpeed = 0.2;
	const bulletLifetime = 1500;
	const enemyCleanupLifetime = 20000;
	const tweenSpeed = 0.0075;

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
		sky, ground,
		ambientLight, shadowLight,
		colors = new game.Colors(),
		network = new game.Network(),
		stats = new Stats();

	game.joinedGame = false;
	game.player = {
		model: null
	};

	//INIT THREE JS, SCREEN AND MOUSE EVENTS
	function clampedAspectRatio(height, width) {
		let ratio = height / width;

		return ratio > 4 ? 4
			: ratio < 0.5 ? 0.5 : ratio;
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
		//hemisphereLight = new THREE.HemisphereLight(colors.White, 0x333333, 0.85);
		ambientLight = new THREE.AmbientLight(0xeeeeff, 0.3);
		shadowLight = new THREE.DirectionalLight(0xffffcc, 1.5);

		shadowLight.position.set(250, 500, 300);
		shadowLight.castShadow = true;

		shadowLight.shadow.camera.left = -600;
		shadowLight.shadow.camera.right = 900;
		shadowLight.shadow.camera.top = 1200;
		shadowLight.shadow.camera.bottom = -1200;
		shadowLight.shadow.camera.near = 1;
		shadowLight.shadow.camera.far = 2000;
		shadowLight.shadow.mapSize.width = 2048;
		shadowLight.shadow.mapSize.height = 2048;

		scene.add(ambientLight);
		scene.add(shadowLight);
	}

	function createNameLabel(name) {
		let nameLabel = new SpriteText2D(name, { align: textAlign.center, font: '40px Arial', fillStyle: '#000000', antialias: false });
		nameLabel.position.set(0, 90, 0);

		return nameLabel;
	}

	function createPlane(options) {
		let color = parseInt(options.color);
		let plane = new game.entities.AirPlane({color: color});
		plane.mesh.scale.set(0.25, 0.25, 0.25);
		plane.mesh.position.y = 100;
		plane.mesh.position.z = 200;

		plane.mesh.add(createNameLabel(options.name));

		return plane;
	}

	function createGround() {
		ground = new game.entities.Ground();
		ground.mesh.position.y = -groundRadius - 100;

		scene.add(ground.mesh);
	}

	function createSky() {
		sky = new game.entities.Sky();
		sky.mesh.position.y = -groundRadius - 200;
		scene.add(sky.mesh);
	}

	function loop() {
		newTime = performance.now();
		deltaTime = newTime - oldTime;
		oldTime = newTime;

		stats.begin();

		updatePlayerPlane();
		updateOtherPlayerPlanes();
		updateBullets();
		updateEnemies();

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
		// ignore before in game
		if (!game.joinedGame) return;

		let targetY = normalize(mousePos.y, -0.75, 0.75, -50, 330);
		let targetX = normalize(mousePos.x, -0.75, 0.75, -300, 300);

		tweenPositionToTarget(game.player.model.mesh, targetX, targetY);

		game.player.model.propeller.rotation.x += deltaTime * 0.05;
	}

	function tweenPositionToTarget(mesh, targetX, targetY) {
		mesh.position.x += (targetX - mesh.position.x) * deltaTime * tweenSpeed;
		mesh.position.y += (targetY - mesh.position.y) * deltaTime * tweenSpeed;

		mesh.rotation.z = (targetY - mesh.position.y) * deltaTime * tweenSpeed * 0.05;
		mesh.rotation.x = (mesh.position.y - targetY) * deltaTime * tweenSpeed * 0.04;
	}

	function addPlayer(player) {
		let pl = new game.Player(player);
		pl.model = createPlane({name: player.name, color: player.color});
		players.push(pl);

		scene.add(pl.model.mesh);
	}

	function removePlayer(clientId) {
		let playerIdx = players
			.map((e) => { return e.clientId; })
			.indexOf(clientId);

		if (playerIdx > -1) {
			scene.remove(players[playerIdx].model.mesh);
			players.splice(playerIdx, 1);
		}
	}

	function findObjectByKeyValue(array, key, value) {
		let objId = array
			.map((e) => { return e[key]; })
			.indexOf(value);

		return objId > -1 ? array[objId] : null;
	}

	function initNetworkEvents() {
		let server = network.socket;
		server.on('connect', () => {
			toggleHtmlElement('#disconnected', false);
			toggleHtmlElement('#login', true);
		});

		server.on('addPlayer', (player) => {
			// check that it's not own id
			if (player.clientId !== network.clientId) {
				addPlayer(player);
			}
		});

		server.on('removePlayer', (clientId) => {
			if (clientId !== network.clientId) {
				removePlayer(clientId);
			}
		});

		server.on('disconnect', () => {
			players.forEach((player) => {
				removePlayer(player.clientId);
			});

			game.joinedGame = false;
			if (game.player) {
				scene.remove(game.player.model.mesh);
				game.player = null;
			}

			toggleHtmlElement('#login', false);
			toggleHtmlElement('#disconnected', true);
		});

		server.on('playerPositionUpdate', (payload) => {
			if (payload.clientId !== network.clientId) {
				let player = findObjectByKeyValue(players, 'clientId', payload.clientId);
				if (!player) { return; }
				player.lastNetPosition = payload.position;
			}
		});

		server.on('shootBullet', (payload) => {
			let player = findObjectByKeyValue(players, 'clientId', payload.shooter);
			shootBullet(payload.pos, payload.dir, player);
		});

		server.on('joinGame', (playerInfo) => {
			game.joinedGame = true;
			game.player = playerInfo;

			game.player.model = createPlane({name: game.player.name, color: game.player.color});
			scene.add(game.player.model.mesh);
		});

		server.on('enemyUpdate', (enemyList) => {
			enemyList.forEach((enemy) => {
				let foundEnemy = findObjectByKeyValue(enemies, 'id', enemy.id);
				if (!foundEnemy) { spawnEnemy(enemy); }
				//foundEnemy.lastNetPosition = enemy.position;
			});

			enemies.forEach((existingEnemy) => {
				let enemyIdx = enemyList.map((e) => {
									return e.id;
								}).indexOf(existingEnemy.id);
				if (enemyIdx === -1) {
					killEnemy(existingEnemy);
				}
			});
		});

		server.on('chatMessage', (name, message) => {
			addChatMessage(name, message);
		});
	}

	function spawnEnemy(serverEnemy) {
		let enemy = enemies.filter((e) => { return !e.alive; })[0];
		if (enemy) {
			enemy.id = serverEnemy.id;
			enemy.birthTime = serverEnemy.birthTime;
			enemy.health = serverEnemy.health;

			enemy.mesh.position.x = serverEnemy.position.x;
			enemy.mesh.position.y = serverEnemy.position.y;
			enemy.mesh.position.z = serverEnemy.position.z;

			enemy.spawn();
			scene.add(enemy.mesh);
		}
	}

	function killEnemy(serverEnemy) {
		let enemy = findObjectByKeyValue(enemies, 'id', serverEnemy.id);
		if (enemy) {
			enemy.die();
			scene.remove(enemy.mesh);
		}
	}

	function addChatMessage(name, message) {
		let $chatMessages = document.querySelector("#messages");

		let $p = document.createElement('div');
		let $text = document.createTextNode(`[${name}] ${message}`);
		$p.appendChild($text);
		$chatMessages.appendChild($p);

		let messageList = document.querySelectorAll("#messages > div");
		if (messageList.length > 5) {
			messageList[0].remove();
		}
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

	function createBulletPool(poolSize) {
		poolSize = poolSize || 100;
		for (let i = 0; i < poolSize; i++) {
			bullets.push(new game.entities.Bullet());
		}
	}

	function createEnemyPool(poolSize) {
		poolSize = poolSize || 30;
		for (let i = 0; i < poolSize; i++) {
			enemies.push(new game.entities.Enemy());
		}
	}

	function init(event) {
		stats.showPanel(0);
		document.body.appendChild(stats.dom);

		let $nameInput = document.querySelector("#login input");
		let $submitButton = document.querySelector("#submitname");
		let $chatInput = document.querySelector("#send");

		$nameInput.focus();

		$nameInput.addEventListener('keyup', requestJoinGameKeyUp, false);
		$chatInput.addEventListener('keyup', sendChatMessage, false);
		$submitButton.addEventListener('click', requestJoinGame, true);

		document.addEventListener('mousemove', handleMouseMove, false);
		document.addEventListener('click', handleMouseClick, false);

		initNetworkEvents();

		createScene();
		createBulletPool(100);
		createEnemyPool(30);
		createLights();
		createGround();
		createSky();
		loop();
	}

	function toggleHtmlElement(selector, show) {
		let $el = document.querySelector(selector);
		if (!$el) { return; }
		if (show !== 'undefined') {
			$el.style.display = !show ? 'none' : 'block';
		} else {
			$el.style.display = $el.style.display !== 'block' ? 'block' : 'none';
		}
	}

	function requestJoinGameKeyUp(event) {
		if (event.keyCode === 13) {
			requestJoinGame();
		}
	}

	function sendChatMessage(event) {
		let $chatInput = document.querySelector("#send");

		if (event.keyCode === 13) {
			if ($chatInput.value.trim()) {
				game.joinedGame && network.socket.emit('chatMessage', $chatInput.value.trim());
				$chatInput.value = '';
			}
		}
	}

	function requestJoinGame(event) {
		if (game.joinedGame) return;

		let $nameInput = document.querySelector("#login input");
		let name = $nameInput.value;
		let playerColor = colors.RandomPlayerColor;

		if (name && name.trim()) {
			toggleHtmlElement('#login', false);
			network.socket.emit('joinRequest', {name: name, color: playerColor});
		}
	}

	function handleMouseClick(event) {
		// ignore before in game
		if (!game.joinedGame) return;

		let position = new THREE.Vector3();
		position.setFromMatrixPosition(game.player.model.mesh.matrix);

		let directionMatrix = new THREE.Matrix4().extractRotation(game.player.model.mesh.matrix);

		let direction = new THREE.Vector3(0.75, 0, 0);
		direction = direction.applyMatrix4(directionMatrix);
		direction.z = 0;

		network.socket.emit('shootBullet', { pos: position, dir: direction });
		shootBullet(position, direction, game.player);
	}

	function shootBullet(position, direction, origin) {
		let bullet = bullets.filter((b) => { return !b.alive; })[0];
		if (bullet) {
			bullet.mesh.position.x = position.x + 15;
			bullet.mesh.position.y = position.y;

			if (origin) {
				bullet.mesh.material = origin.model.bodyMat;
			}

			bullet.direction = direction;
			bullet.spawn(origin);
			scene.add(bullet.mesh);
		}
	}

	function updateBullets() {
		let now = performance.now();
		bullets
			.filter((b) => { return b.alive; })
			.forEach((b) => {
				if (b.birthTime + bulletLifetime < now) {
					b.die();
					scene.remove(b.mesh);
				}

				b.mesh.position.addScaledVector(b.direction, deltaTime);
			});
	}

	function updateEnemies() {
		let now = performance.now();
		enemies
			.filter((e) => { return e.alive; })
			.forEach((e) => {
				if (e.birthTime + enemyCleanupLifetime < now) {
					e.die();
					scene.remove(e.mesh);
				}

				e.mesh.rotation.x += deltaTime * 0.001;
				e.mesh.rotation.y += deltaTime * 0.003;
				e.mesh.rotation.z += deltaTime * 0.005;
			});
	}

	function handleMouseMove(event) {
		// ignore before in game
		if (!game.joinedGame) return;

		var tx = -1 + (event.clientX / WIDTH) * 2;
		var ty = 1 - (event.clientY / HEIGHT) * 2;
		mousePos = { x: tx, y: ty };
		throttledPositionUpdate();
	}

	var throttledPositionUpdate = throttle(() => {
		var translatedY = normalize(mousePos.y, -0.75, 0.75, -50, 330);
		var translatedX = normalize(mousePos.x, -0.75, 0.75, -300, 300);

		network.socket.emit('positionUpdate', { x: translatedX, y: translatedY, z: game.player.model.mesh.position.z });
	}, 50);

})();



