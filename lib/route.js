'use strict';

module.exports = function route(router, path, collection, rights) {

	function parseBody(req, res, cb) {
		if (req.body) {
			return cb(req.body);
		}

		const contentType = req.headers['content-type'] || '';

		if (!contentType.startsWith('application/json')) {
			res.sendStatus(415); // Unsupported Media Type
		}

		req.setEncoding('utf8');

		let body = '';

		req.on('data', function (data) {
			body += data;
		})

		req.on('end', function () {
			try {
				body = JSON.parse(body);
			} catch (error) {
				res.sendStatus(400); // Bad request
				return;
			}

			cb(body);
		});
	}

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
		parseBody(req, res, function (body) {
			collection.request(rights, req, res).post(body, respond);
		})
	});

	// PUT the whole collection

	router.put(path, function (req, res) {
		parseBody(req, res, function (body) {
			collection.request(rights, req, res).put(undefined, body, respond);
		});
	});

	// PUT one item

	router.put(path + '/:id', function (req, res) {
		parseBody(req, res, function (body) {
			collection.request(rights, req, res).put(req.params.id, body, respond);
		});
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
