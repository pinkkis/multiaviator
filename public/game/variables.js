(() => {
window.game = window.game || {};

	class Colors {
		get Player() {
			return 0xff3333;
		}
		get RandomPlayerColor() {
			let color = new THREE.Color(`hsl(${Math.floor(Math.random()*255)}, 95%, 50%)`);
			return color.getHex();
		}
		get Grey() {
			return 0x999999;
		}
		get DarkGrey() {
			return 0x444444;
		}
		get Red() {
			return 0xf25346;
		}
		get White() {
			return 0xd8d0d1;
		}
		get Brown() {
			return 0x59332e;
		}
		get Pink() {
			return 0xF5986E;
		}
		get BrownDark() {
			return 0x23190f;
		}
		get Blue() {
			return 0x68c3c0;
		}
		get Green() {
			return 0x38a330;
		}
	}

	game.Colors = Colors;

})();