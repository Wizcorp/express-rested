'use strict';


function createRightTest(value, defaultValue) {
	if (typeof value === 'boolean') {
		return function () {
			return value;
		};
	}

	if (typeof value === 'function') {
		return value;
	}

	return createRightTest(defaultValue, false);
}


function resourceHasId(resource) {
	const id = resource.getId();
	return (id === null || id === undefined) ? false : true;
}


function sendMethodNotAllowedWithHeader(res, allowedMethods) {
	res.set('Allow', allowedMethods);
	res.sendStatus(405); // Method not allowed
}


function sendMethodNotAllowed(method, req, res, resource, rights) {
	const methods = [];

	if (req.method !== 'GET' && rights.read(req, res, resource)) {
		methods.push('GET', 'HEAD');
	}

	if (req.method !== 'POST' && typeof resource.createId === 'function' && rights.create(req, res, resource)) {
		methods.push('POST');
	}

	if (req.method !== 'PUT') {
		const hasId = resourceHasId(resource);

		if (!hasId && typeof resource.setId === 'function' && rights.create(req, res, resource)) {
			methods.push('PUT');
		} else if (hasId && typeof resource.edit === 'function' && rights.update(req, res, resource)) {
			methods.push('PUT');
		}
	}

	if (req.method !== 'DELETE' && rights.delete(req, res, resource)) {
		methods.push('DELETE');
	}

	sendMethodNotAllowedWithHeader(res, methods.join(', '));
}


module.exports = function (router, path, collection, Class, options) {
	options = options || {};
	options.rights = options.rights || {};

	const rights = {
		create: createRightTest(options.rights.create, options.defaultRight),
		read: createRightTest(options.rights.read, options.defaultRight),
		update: createRightTest(options.rights.update, options.defaultRight),
		delete: createRightTest(options.rights.delete, options.defaultRight)
	};

	function create(req) {
		try {
			return new Class(null, req.body);
		} catch (error) {
			return undefined;
		}
	}

	// GET list of all items in the collection

	router.get(path, function (req, res) {
		const result = [];

		const resources = collection.list();
		for (let i = 0; i < resources.length; i++) {
			const resource = resources[i];

			if (rights.read(req, res, resource)) {
				result.push(resource.getId());
			}
		}

		res.json(result);
	});

	// GET one item

	router.get(path + '/:id', function (req, res) {
		const resource = collection.get(req.params.id);

		if (resource === undefined) {
			return res.sendStatus(404); // Not found
		}

		if (!rights.read(req, res, resource)) {
			return sendMethodNotAllowed(req, res, resource, rights);
		}

		return res.json(resource);
	});

	// POST one item

	router.post(path, function (req, res) {
		const resource = create(req);

		if (!resource) {
			return res.sendStatus(415); // Unsupported media type
		}

		if (resourceHasId(resource)) {
			return res.sendStatus(409); // Conflict (the ID should not be decided on yet)
		}

		if (!resource.createId) {
			// IDs must be passed from the client using PUT

			return sendMethodNotAllowed(req, res, resource, rights);
		}

		if (!rights.create(req, res, resource)) {
			return sendMethodNotAllowed(req, res, resource, rights);
		}

		resource.createId();

		if (collection.has(resource.getId())) {
			return res.sendStatus(500); // Internal server error
		}

		collection.set(resource, function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.json(resource);
			}
		});

	});

	// TODO: PUT the whole collection

	router.put(path, function (req, res) {
		sendMethodNotAllowedWithHeader(res, 'GET, POST, DELETE');
	});

	// PUT one item

	router.put(path + '/:id', function (req, res) {
		const id = req.params.id;
		let resource = collection.get(id);

		if (resource === undefined) {
			// creation

			resource = create(req);

			if (!resource) {
				return res.sendStatus(415); // Unsupported media type
			}

			if (typeof resource.setId !== 'function') {
				return sendMethodNotAllowed(req, res, resource, rights);
			}

			if (!rights.create(req, res, resource)) {
				return sendMethodNotAllowed(req, res, resource, rights);
			}

			resource.setId(id);
		} else {
			// update

			if (typeof resource.edit !== 'function') {
				return sendMethodNotAllowed(req, res, resource, rights);
			}

			if (!rights.update(req, res, resource)) {
				return sendMethodNotAllowed(req, res, resource, rights);
			}

			resource.edit(req.body);
		}

		collection.set(resource, function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.json(resource);
			}
		});
	});

	// DELETE the whole collection

	router.delete(path, function (req, res) {
		const resources = collection.list();
		for (let i = 0; i < resources.length; i++) {
			if (!rights.delete(req, res, resources[i])) {
				return sendMethodNotAllowed(req, res, resources[i], rights);
			}
		}

		collection.delAll(function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.sendStatus(204);
			}
		});
	});

	// DELETE one item

	router.delete(path + '/:id', function (req, res) {
		const resource = collection.get(req.params.id);

		if (resource === undefined) {
			return res.sendStatus(404); // Not found
		}

		if (!rights.delete(req, res, resource)) {
			return sendMethodNotAllowed(req, res, resource, rights);
		}

		collection.del(resource, function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.sendStatus(204);
			}
		});
	});
};
