'use strict';


const Collection = require('./Collection');
const route = require('./route');


class Rest {
	constructor(router) {
		this.router = router;
	}

	add(Class, path, options) {
		if (!options && path && typeof path === 'object') {
			options = path;
			path = null;
		}

		options = options || {};

		const collection = new Collection(Class);

		if (options.persist) {
			collection.persist(options.persist);
		}

		if (this.router) {
			if (!path) {
				path = '/' + Class.prototype.constructor.name;
			}

			route(this.router, path, collection, Class, options);
		}

		return collection;
	}
}


module.exports = Rest;
