'use strict';

module.exports = function (collection, context, obj, cb) {
	const id = context.baseName;
	let resource = collection.get(id);

	if (resource === undefined) {
		// creation

		if (!context.isJson()) {
			return cb(context.setStatus(404)); // Not found
		}

		resource = collection.instantiate(id, obj);

		if (!resource) {
			return cb(context.setStatus(400)); // Bad request
		}

		if (!context.mayCreate(resource)) {
			return cb(context.disallow(resource)); // Method not allowed
		}

		context.setStatus(201); // Created
	} else {
		// update

		if (!context.isJson()) {
			const fn = context.createCustomFn('put', resource);
			if (!fn) {
				return cb(context.setStatus(415)); // Unsupported Media Type
			}

			return fn();
		}

		if (!context.mayUpdate(resource)) {
			return cb(context.disallow(resource)); // Method not allowed
		}

		try {
			resource.edit(obj);
		} catch (error) {
			return cb(context.setStatus(400)); // Bad request
		}

		context.setStatus(204); // No content
	}

	collection.set(id, resource, function (error) {
		if (error) {
			return cb(context.setStatus(500)); // Internal server error
		}

		context.setLocation();

		return cb(context);
	});
};
