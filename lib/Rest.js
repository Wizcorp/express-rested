'use strict';


const Collection = require('./Collection');
const route = require('./route');


class Rest {
	constructor(router) {
		this.router = router;
	}

	add(path, Class, options) {
		options = options || {};

		const collection = new Collection(Class);

		if (options.persist) {
			collection.persist(options.persist);
		}

		if (this.router) {
			route(this.router, path, collection, Class, options);
		}

		return collection;
	}
}


module.exports = Rest;
