'use strict';

const createRightTests = require('./createRightTests');


function resourceHasId(resource) {
	if (typeof resource.getId !== 'function') {
		return false;
	}

	const id = resource.getId();
	return (id === null || id === undefined) ? false : true;
}


function sendMethodNotAllowed(req, res, resource, rights) {
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

	if (methods.length === 0) {
		res.sendStatus(404); // Not found
	} else {
		res.set('Allow', methods.join(', '));
		res.sendStatus(405); // Method not allowed
	}
}


module.exports = function (router, path, collection, Class, options) {
	if (typeof Class !== 'function') {
		throw new TypeError('Provided class is not a function (constructor)');
	}

	if (!path) {
		path = '/' + Class.prototype.constructor.name;
	}

	options = options || {};

	const rights = createRightTests(options.rights);

	function create(req, res, obj) {
		if (!obj || typeof obj !== 'object') {
			res.sendStatus(415); // Unsupported media type
			return undefined;
		}

		let resource;

		try {
			resource = new Class(null, obj);
		} catch (error) {
			res.sendStatus(400); // Bad request
			return undefined;
		}

		if (!rights.create(req, res, resource)) {
			sendMethodNotAllowed(req, res, resource, rights);
			return undefined;
		}

		return resource;
	}

	function update(req, res, resource, obj) {
		if (typeof resource.edit !== 'function') {
			sendMethodNotAllowed(req, res, resource, rights);
			return false;
		}

		if (!rights.update(req, res, resource)) {
			sendMethodNotAllowed(req, res, resource, rights);
			return false;
		}

		try {
			resource.edit(obj);
		} catch (error) {
			res.sendStatus(400); // Bad request
			return false;
		}

		return true;
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
		const resource = create(req, res, req.body);
		if (!resource) {
			return;
		}

		if (resourceHasId(resource)) {
			return res.sendStatus(409); // Conflict (the ID should not be decided on yet)
		}

		if (!resource.createId) {
			// IDs must be passed from the client using PUT

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

	// PUT the whole collection

	router.put(path, function (req, res) {
		if (!req.body || typeof req.body !== 'object') {
			return res.sendStatus(400); // Bad request
		}

		const resources = {};
		const ids = Object.keys(req.body);
		const toDelete = collection.getAll();

		for (let i = 0; i < ids.length; i++) {
			const id = ids[i];
			let resource = collection.get(id);

			if (!resource) {
				// create

				resource = create(req, res, req.body[id]);
				if (!resource) {
					return;
				}

				if (typeof resource.setId !== 'function') {
					return sendMethodNotAllowed(req, res, resource, rights);
				}

				resource.setId(id);
			} else {
				// update

				if (!update(req, res, resource, req.body[id])) {
					return;
				}

				// forget about deleting this resource

				delete toDelete[id];
			}

			resources[id] = resource;
		}

		// check deletion rights

		const deleteIds = Object.keys(toDelete);

		for (let i = 0; i < deleteIds.length; i++) {
			const resource = toDelete[deleteIds[i]];

			if (!rights.delete(req, res, resource)) {
				return sendMethodNotAllowed(req, res, resource, rights);
			}
		}

		// persist

		collection.setAll(resources, function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.sendStatus(204);
			}
		});
	});

	// PUT one item

	router.put(path + '/:id', function (req, res) {
		const id = req.params.id;
		let resource = collection.get(id);

		if (resource === undefined) {
			// creation

			resource = create(req, res, req.body);
			if (!resource) {
				return;
			}

			if (typeof resource.setId !== 'function') {
				return sendMethodNotAllowed(req, res, resource, rights);
			}

			resource.setId(id);
		} else {
			// update

			if (!update(req, res, resource, req.body)) {
				return;
			}
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

		collection.del(req.params.id, function (error) {
			if (error) {
				res.sendStatus(500); // Internal server error
			} else {
				res.sendStatus(204);
			}
		});
	});
};
