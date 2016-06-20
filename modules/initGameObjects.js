'use strict';

let generator = {
	generateObjects(object, count) {
		let arr = [];
		for (let i = 0; i < count; i++) {
			arr.push(new object());
		}

		return arr;
	}
};


module.exports = generator;