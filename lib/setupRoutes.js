'use strict';

const ResponseContext = require('./ResponseContext');
const log = require('util').debuglog('rested');

const reJsonMediaType = /^application\/json/;
const reJsonExt = /\.json$/;

const api = {
	collection: {
		delete: require('./operations/collection/delete'),
		get: require('./operations/collection/get'),
		post: require('./operations/collection/post'),
		put: require('./operations/collection/put')
	},
	resource: {
		delete: require('./operations/resource/delete'),
		get: require('./operations/resource/get'),
		patch: require('./operations/resource/patch'),
		put: require('./operations/resource/put')
	}
};


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


// generic callback for HTTP responses with a ResponseContext object

function respond(context) {
	context.respond();
}


// route handlers

module.exports = function setupRoutes(router, collection, path, rights) {
	// Set up a regular expression for the given path and optionally allow extensions

	const reCollection = new RegExp('^' + path + '(\\.[a-zA-Z]+)?/?$');

	// GET all resources in the collection

	router.get(reCollection, function (req, res) {
		log('HTTP GET collection:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.collection.get(collection, context, respond);
	});

	// GET one resource

	router.get(path + '/:file', function (req, res) {
		log('HTTP GET resource:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.resource.get(collection, context, respond);
	});

	// POST one resource

	router.post(reCollection, parseJson, function (req, res) {
		log('HTTP POST collection:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.collection.post(collection, context, req.body, respond);
	});

	// PUT the whole collection

	router.put(reCollection, parseJson, function (req, res) {
		log('HTTP PUT collection:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.collection.put(collection, context, req.body, respond);
	});

	// PUT one resource

	router.put(path + '/:file', parseJson, function (req, res) {
		log('HTTP PUT resource:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.resource.put(collection, context, req.body, respond);
	});

	// PATCH one resource

	router.patch(path + '/:file', parseJson, function (req, res) {
		log('HTTP PATCH resource:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.resource.patch(collection, context, req.body, respond);
	});

	// DELETE the whole collection

	router.delete(reCollection, function (req, res) {
		log('HTTP DELETE collection:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.collection.delete(collection, context, respond);
	});

	// DELETE one resource

	router.delete(path + '/:file', function (req, res) {
		log('HTTP DELETE resource:', req.url);

		const context = new ResponseContext(req, res, rights);

		api.resource.delete(collection, context, respond);
	});
};
