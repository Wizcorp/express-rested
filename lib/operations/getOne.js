'use strict';


module.exports = function getOne(collection, context, id, cb) {
	const resource = collection.get(id);

	if (resource === undefined) {
		return cb(context.setStatus(404)); // Not found
	}

	if (!context.mayRead(resource)) {
		return cb(context.disallow(resource)); // Method not allowed
	}

	return cb(context.setStatus(200).setBody(resource)); // OK
};
