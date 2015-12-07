'use strict';


const Collection = require('./Collection');
const route = require('./route');
const createRightsTests = require('./createRightsTests');


class Rest {
	constructor(router) {
		this.router = router;
		this.collections = {};
	}

	add(Class, path, options) {
		// path and options are optional

		if (!options && path && typeof path === 'object') {
			options = path;
			path = null;
		} else {
			options = options || {};
		}

		const className = Class.prototype && Class.prototype.constructor && Class.prototype.constructor.name;
		const collection = new Collection(Class);

		if (options.persist) {
			collection.persist(options.persist);
		}

		if (this.router) {
			const rights = createRightsTests(options.rights);

			if (!path) {
				path = '/' + className;
			} else if (path[0] !== '/') {
				path = '/' + path;
			}

			route(this.router, path, collection, rights);
		}

		if (className) {
			this.collections[className.toLowerCase()] = collection;
		}

		return collection;
	}

	get(name) {
		return this.collections[name.toLowerCase()];
	}
}


module.exports = Rest;
