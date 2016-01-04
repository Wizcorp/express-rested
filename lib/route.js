'use strict';

const reJsonMediaType = /^application\/json/;
const reJsonExt = /\.json$/;


function getBodyStr(req, res, cb) {
	req.setEncoding('utf8');

	let body = '';

	req.on('error', function () {
		res.sendStatus(400); // Bad request
	});

	req.on('data', function (data) {
		body += data;
	});

	req.on('end', function () {
		if (body) {
			return cb(body);
		}

		res.sendStatus(400); // Bad request
	});
}


function parseJson(req, res, next) {
	if (req.body) {
		return next();
	}

	const isJson = reJsonExt.test(req.path || '') || reJsonMediaType.test(req.headers['content-type'] || '');

	if (!isJson) {
		return next();
	}

	getBodyStr(req, res, function (body) {
		try {
			// Assign the parsed JSON to req.body

			req.body = JSON.parse(body);
		} catch (error) {
			res.sendStatus(400); // Bad request
			return;
		}

		next();
	});
}


function respond(context) {
	const res = context.res;

	res.status(context.status);
	res.set(context.headers);
	res.end(context.body);
}


// route handlers

module.exports = function route(router, path, collection, rights) {
	// GET all items in the collection

	router.get(path, function (req, res) {
		collection.request(rights, req, res).get(undefined, req.query, respond);
	});

	// GET one item

	router.get(path + '/:file', function (req, res) {
		collection.request(rights, req, res).get(req.params.file, undefined, respond);
	});

	// POST one item

	router.post(path, parseJson, function (req, res) {
		collection.request(rights, req, res).post(req.body, respond);
	});

	// PUT the whole collection

	router.put(path, parseJson, function (req, res) {
		collection.request(rights, req, res).put(undefined, req.body, respond);
	});

	// PUT one item

	router.put(path + '/:file', parseJson, function (req, res) {
		collection.request(rights, req, res).put(req.params.file, req.body, respond);
	});

	// PATCH one item

	router.patch(path + '/:file', parseJson, function (req, res) {
		collection.request(rights, req, res).patch(req.params.file, req.body, respond);
	});

	// DELETE the whole collection

	router.delete(path, function (req, res) {
		collection.request(rights, req, res).delete(undefined, respond);
	});

	// DELETE one item

	router.delete(path + '/:file', function (req, res) {
		collection.request(rights, req, res).delete(req.params.file, respond);
	});
};
