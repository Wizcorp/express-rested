'use strict';

module.exports = function patchOne(collection, context, id, data, cb) {
	const resource = collection.get(id);

	if (!resource) {
		return cb(context.setStatus(404)); // Not Found
	}

	if (!context.mayUpdate(resource)) {
		return cb(context.disallow(resource)); // Method not allowed
	}

	try {
		resource.edit(data);
	} catch (error) {
		return cb(context.setStatus(400)); // Bad request
	}

	collection.set(id, resource, function (error) {
		if (error) {
			return cb(context.setStatus(500)); // Internal server error
		}

		return cb(context.setStatus(204)); // No content
	});
};
