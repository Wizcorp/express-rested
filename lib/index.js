'use strict';

const Collection = require('./Collection');
const createRightsTests = require('./createRightsTests');
const setupRoutes = require('./setupRoutes');

const collections = {};


exports.getCollection = function (name) {
	return collections[name.toLowerCase()];
};


exports.createCollection = function (Class, options) {
	const collection = new Collection(Class);
	const className = Class.prototype && Class.prototype.constructor && Class.prototype.constructor.name;

	collections[className.toLowerCase()] = collection;

	if (options && options.persist) {
		collection.persist(options.persist);
	}

	return collection;
};


exports.delCollection = function (name) {
	delete collections[name.toLowerCase()];
};


exports.route = function (router) {
	if (!router) {
		throw new Error('Router argument missing');
	}

	return function route(collection, path, options) {
		// path and options are optional

		if (!options && path && typeof path === 'object') {
			options = path;
			path = null;
		} else {
			options = options || {};
		}

		const rights = createRightsTests(options.rights);

		if (!path) {
			path = '/' + collection.constructor.name;
		} else if (path[0] !== '/') {
			path = '/' + path;
		}

		setupRoutes(router, collection, path, rights);
	};
};
