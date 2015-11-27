'use strict';

class Beer {
	constructor(id, info) {
		this.setId(id);
		this.edit(info);
	}

	createId() {
		this.id = this.name;
	}

	getId() {
		return this.id;
	}

	setId(id) {
		this.id = id;
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}
}

module.exports = Beer;
