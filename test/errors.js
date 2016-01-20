'use strict';

const test = require('tape');
const assert = require('assert');
const createServer = require('./helpers/server');


test('Errors', function (t) {
	let server, collection, http, Beer, originalEdit;

	t.test('Start REST server', function (t) {
		const options = { rights: true };

		createServer(t, options, function (_server, _collection, _http) {
			server = _server;
			collection = _collection;
			Beer = collection.Class;
			http = _http;
			t.end();

			originalEdit = Beer.prototype.edit;

			Beer.prototype.edit = function (info) {
				assert(info.name.length > 0, 'Name is empty');

				if (info.name === 'fail') {
					const error = new Error('Name fail');
					error.code = 'namefail';
					throw error;
				}

				this.name = info.name;
			};
		});
	});

	t.test('JavaScript error', function (t) {
		const info = {};

		http.post(t, '/rest/beer', info, function (data, res) {
			t.equal(res.statusCode, 400, 'HTTP status 400 (Bad request)');
			t.end();
		});
	});

	t.test('Assertion error', function (t) {
		const info = { name: '' };

		http.post(t, '/rest/beer', info, function (data, res) {
			t.equal(res.statusCode, 400, 'HTTP status 400 (Bad request)');
			t.end();
		});
	});

	t.test('Error code', function (t) {
		const info = { name: 'fail' };

		http.post(t, '/rest/beer', info, function (data, res) {
			t.equal(res.statusCode, 400, 'HTTP status 400 (Bad request)');
			t.equal(res.headers['x-error-code'], 'namefail', 'x-error-code header set');
			t.end();
		});
	});

	t.test('Close REST server', function (t) {
		server.close(function () {
			Beer.prototype.edit = originalEdit;
			t.end();
		});
	});
});
