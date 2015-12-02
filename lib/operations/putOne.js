'use strict';

module.exports = function putOne(collection, context, id, data, cb) {
	let resource = collection.get(id);

	if (resource === undefined) {
		// creation

		resource = collection.instantiate(id, data);

		if (!resource) {
			return cb(context.setStatus(400)); // Bad request
		}

		if (!context.mayCreate(resource)) {
			return cb(context.disallow(resource)); // Method not allowed
		}

		context.setStatus(201); // Created
	} else {
		// update

		if (!context.mayUpdate(resource)) {
			return cb(context.disallow(resource)); // Method not allowed
		}

		try {
			resource.edit(data);
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
