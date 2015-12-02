'use strict';


const Collection = require('./Collection');
const route = require('./route');
const createRightsTests = require('./createRightsTests');


class Rest {
	constructor(router) {
		this.router = router;
	}

	createRightsTests(rights) {
		return createRightsTests(rights);
	}

	add(Class, path, options) {
		// path and options are optional

		if (!options && path && typeof path === 'object') {
			options = path;
			path = null;
		} else {
			options = options || {};
		}

		if (!path) {
			path = '/' + Class.prototype.constructor.name;
		} else if (path[0] !== '/') {
			path = '/' + path;
		}

		const collection = new Collection(Class);

		if (options.persist) {
			collection.persist(options.persist);
		}

		if (this.router) {
			const rights = this.createRightsTests(options.rights);

			route(this.router, path, collection, rights);
		}

		return collection;
	}
}


module.exports = Rest;
