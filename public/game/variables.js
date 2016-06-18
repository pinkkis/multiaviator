(() => {
window.game = window.game || {};

	class Colors {
		get Player() {
			return 0xf33333;
		}
		get RandomPlayerColor() {
			let colors = [0x3333ff, 0x6666ff, 0x3366ff, 0x663366, 0xffff33, 0xff66ff, 0xff6666, 0x66ff33];
			let randomIndex = Math.floor(Math.random() * colors.length);
			return colors[randomIndex];
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