'use strict';

module.exports = function postOne(collection, context, data, cb) {
	const resource = collection.instantiate(null, data);
	if (!resource) {
		return cb(context.setStatus(400)); // Bad request
	}

	if (!context.mayCreate(resource)) {
		return cb(context.disallow(resource)); // Method not allowed
	}

	if (!resource.createId) {
		// IDs must be passed from the client using PUT

		return cb(context.disallow(resource)); // Method not allowed
	}

	const id = resource.createId();

	if (collection.has(id)) {
		return cb(context.setStatus(500)); // Internal server error
	}

	collection.set(id, resource, function (error) {
		if (error) {
			return cb(context.setStatus(500)); // Internal server error
		}

		context.setLocation(id);

		return cb(context.setStatus(201)); // Created
	});
};
