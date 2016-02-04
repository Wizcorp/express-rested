'use strict';

module.exports = function (collection, context, obj, cb) {
	if (!context.isJson()) {
		return cb(context.setStatus(415)); // Unsupported Media Type
	}

	let resource;

	try {
		resource = new collection.Class(null, obj);
	} catch (error) {
		return cb(context.setStatus(400, error)); // Bad request
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
		return cb(context.setStatus(500, new Error('Generated ID already exists'))); // Internal server error
	}

	collection.set(id, resource, function (error) {
		if (error) {
			return cb(context.setStatus(500, error)); // Internal server error
		}

		context.setLocation(id);

		return cb(context.setStatus(201)); // Created
	});
};
