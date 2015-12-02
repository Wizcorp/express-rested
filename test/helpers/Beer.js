'use strict';

class Beer {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}

	createId() {
		this.id = this.name;
		return this.id;
	}
}

module.exports = Beer;
