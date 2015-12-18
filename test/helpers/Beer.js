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

	// special extensions

	getTxt(req, res) {
		res.status(200).send('GET .txt');
	}

	putTxt(req, res) {
		res.status(200).send('PUT .txt');
	}

	patchTxt(req, res) {
		res.status(200).send('PATCH .txt');
	}

	deleteTxt(req, res) {
		res.status(200).send('DELETE .txt');
	}
}

module.exports = Beer;
