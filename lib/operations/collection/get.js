'use strict';

module.exports = function (collection, context, cb) {
	const result = {};

	const query = context.query;
	const map = collection.getMapRef();
	const keys = Object.keys(map);

	for (let i = 0; i < keys.length; i++) {
		const id = keys[i];
		const resource = map[id];

		if (context.mayRead(resource) && (!query || (resource.matches && resource.matches(query)))) {
			result[id] = resource;
		}
	}

	cb(context.setStatus(200).setBody(result));
};
