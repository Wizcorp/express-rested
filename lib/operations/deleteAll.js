'use strict';

module.exports = function deleteAll(collection, context, cb) {
	const resources = collection.getList();
	for (let i = 0; i < resources.length; i++) {
		const resource = resources[i];

		if (!context.mayDelete(resource)) {
			return cb(context.disallow(resource)); // Method not allowed
		}
	}

	collection.delAll(function (error) {
		if (error) {
			return cb(context.setStatus(500)); // Internal server error
		}

		return cb(context.setStatus(204)); // No content
	});
};
