'use strict';

module.exports = function (collection, context, cb) {
	const id = context.baseName;
	const resource = collection.get(id);

	if (resource === undefined) {
		return cb(context.setStatus(404)); // Not found
	}

	if (!context.isJson()) {
		const fn = context.createCustomFn('delete', resource);
		if (!fn) {
			return cb(context.setStatus(415)); // Unsupported Media Type
		}

		return fn();
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
