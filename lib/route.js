'use strict';

module.exports = function route(router, path, collection, rights) {

	function respond(context) {
		const res = context.res;

		res.status(context.status);
		res.set(context.headers);
		res.end(context.body);
	}


	// GET all items in the collection

	router.get(path, function (req, res) {
		collection.request(rights, req, res).get(undefined, respond);
	});

	// GET one item

	router.get(path + '/:id', function (req, res) {
		collection.request(rights, req, res).get(req.params.id, respond);
	});

	// POST one item

	router.post(path, function (req, res) {
		collection.request(rights, req, res).post(req.body, respond);
	});

	// PUT the whole collection

	router.put(path, function (req, res) {
		collection.request(rights, req, res).put(undefined, req.body, respond);
	});

	// PUT one item

	router.put(path + '/:id', function (req, res) {
		collection.request(rights, req, res).put(req.params.id, req.body, respond);
	});

	// DELETE the whole collection

	router.delete(path, function (req, res) {
		collection.request(rights, req, res).delete(undefined, respond);
	});

	// DELETE one item

	router.delete(path + '/:id', function (req, res) {
		collection.request(rights, req, res).delete(req.params.id, respond);
	});
};
