'use strict';

const path = require('path');

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


function cleanExt(ext) {
	if (!ext) {
		return undefined;
	}

	return ext[0] === '.' ? ext.slice(1) : ext;
}


function getExt(fileName) {
	return cleanExt(path.extname(fileName || ''));
}


// route handlers

module.exports = function route(router, path, collection, rights) {
	// Set up a regular expression for the given path and optionally allow extensions

	const reCollection = new RegExp('^' + path + '(\\.[a-zA-Z]+)?/?$');

	// GET all items in the collection

	router.get(reCollection, function (req, res) {
		collection.request(rights, req, res).get(undefined, cleanExt(req.params[0]), req.query, respond);
	});

	// GET one item

	router.get(path + '/:file', function (req, res) {
		collection.request(rights, req, res).get(req.params.file, getExt(req.params.file), undefined, respond);
	});

	// POST one item

	router.post(reCollection, parseJson, function (req, res) {
		collection.request(rights, req, res).post(req.body, cleanExt(req.params[0]), respond);
	});

	// PUT the whole collection

	router.put(reCollection, parseJson, function (req, res) {
		collection.request(rights, req, res).put(undefined, cleanExt(req.params[0]), req.body, respond);
	});

	// PUT one item

	router.put(path + '/:file', parseJson, function (req, res) {
		collection.request(rights, req, res).put(req.params.file, getExt(req.params.file), req.body, respond);
	});

	// PATCH one item

	router.patch(path + '/:file', parseJson, function (req, res) {
		collection.request(rights, req, res).patch(req.params.file, getExt(req.params.file), req.body, respond);
	});

	// DELETE the whole collection

	router.delete(reCollection, function (req, res) {
		collection.request(rights, req, res).delete(undefined, cleanExt(req.params[0]), respond);
	});

	// DELETE one item

	router.delete(path + '/:file', function (req, res) {
		collection.request(rights, req, res).delete(req.params.file, getExt(req.params.file), respond);
	});
};
