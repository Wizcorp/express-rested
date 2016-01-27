'use strict';

function createList(map, context) {
	const keys = Object.keys(map);
	const query = context.query;
	const result = [];

	for (let i = 0; i < keys.length; i++) {
		const id = keys[i];
		const resource = map[id];

		if (context.mayRead(resource) && (!query || (resource.matches && resource.matches(query)))) {
			result.push(resource);
		}
	}

	return result;
}

function createMap(map, context) {
	const keys = Object.keys(map);
	const query = context.query;
	const result = {};

	for (let i = 0; i < keys.length; i++) {
		const id = keys[i];
		const resource = map[id];

		if (context.mayRead(resource) && (!query || (resource.matches && resource.matches(query)))) {
			result[id] = resource;
		}
	}

	return result;
}


module.exports = function (collection, context, cb) {
	const fn = context.createCustomFn('get', collection.Class);
	const map = collection.getMapRef();

	if (fn) {
		return fn(createList(map, context));
	}

	if (!context.isJson()) {
		return cb(context.setStatus(415)); // Unsupported Media Type
	}

	if (!context.isModified(collection)) {
		return cb(context.setStatus(304)); // Not Modified
	}

	cb(context.setStatus(200).setBody(createMap(map, context)));
};
