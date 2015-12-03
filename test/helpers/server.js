'use strict';

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const HttpClient = require('./HttpClient');
const Beer = require('./Beer');

module.exports = function (t, options, cb) {
	const path = '/beer';
	const app = express();
	const router = new express.Router();
	const rest = require('../../')(router);

	if (options.autoParse) {
		app.use(bodyParser.json());
	}

	app.use('/rest', router);

	const collection = rest.add(Beer, path, options);

	const server = http.createServer(app);

	server.listen(0, function (error) {
		if (error) {
			t.fail(error);
			t.end();
			return;
		}

		cb(server, collection, new HttpClient('http://localhost:' + server.address().port + '/rest'), rest);
	});
};
