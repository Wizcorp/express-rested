'use strict';

module.exports = function deleteOne(collection, context, id, cb) {
	const resource = collection.get(id);

	if (resource === undefined) {
		return cb(context.setStatus(404)); // Not found
	}

	if (!context.mayDelete(resource)) {
		return cb(context.disallow(resource)); // Method not allowed
	}

	collection.del(id, function (error) {
		if (error) {
			return cb(context.setStatus(500)); // Internal server error
		}

		return cb(context.setStatus(204)); // No content
	});
};
