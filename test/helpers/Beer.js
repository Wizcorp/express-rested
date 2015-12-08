'use strict';

const assert = require('assert');

class Beer {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	edit(info) {
		assert(info);

		if (info.name) {
			this.name = info.name;
		}

		if (info.rating) {
			this.rating = info.rating;
		}
	}

	createId() {
		this.id = this.name;
		return this.id;
	}
}

module.exports = Beer;
