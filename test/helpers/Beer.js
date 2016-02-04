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

	matches(query) {
		return query.name && this.name.indexOf(query.name) !== -1;
	}

	// special extensions

	getThrow() {
		throw new Error('Whoops');
	}

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

	static getTxt(req, res, beers) {
		// returns newline separated beers, sorted by name

		beers.sort(function (a, b) {
			return a.name.localeCompare(b.name);
		});

		beers = beers.map(function (beer) {
			return JSON.stringify(beer);
		});

		res.status(200).send(beers.join('\n'));
	}
}

module.exports = Beer;
