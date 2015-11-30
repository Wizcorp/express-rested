'use strict';

class Beer {
	constructor(id, info) {
		this.setId(id);
		this.edit(info);
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}

	createId() {
		this.id = this.name;
	}

	setId(id) {
		this.id = id;
	}

	getId() {
		return this.id;
	}
}

module.exports = Beer;
