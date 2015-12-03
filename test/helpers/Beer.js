'use strict';

const assert = require('assert');

class Beer {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	edit(info) {
		assert(info.name);
		assert(info.rating);

		this.name = info.name;
		this.rating = info.rating;
	}

	createId() {
		this.id = this.name;
		return this.id;
	}
}

module.exports = Beer;
