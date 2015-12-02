'use strict';

module.exports = function getAllowedMethods(req, res, rights, resource) {
	const methods = [];

	// GET, HEAD

	if (rights.read(req, res, resource)) {
		methods.push('GET', 'HEAD');
	}

	// POST

	if (typeof resource.createId === 'function' && rights.create(req, res, resource)) {
		methods.push('POST');
	}

	// PUT

	if (rights.create(req, res, resource)) {
		methods.push('PUT');
	} else if (typeof resource.edit === 'function' && rights.update(req, res, resource)) {
		methods.push('PUT');
	}

	// DELETE

	if (rights.delete(req, res, resource)) {
		methods.push('DELETE');
	}

	return methods;
};
