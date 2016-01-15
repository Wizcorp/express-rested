'use strict';

const test = require('tape');
const createServer = require('./helpers/server');
const basename = require('path').basename;


test('Body parser', function (t) {
	const options = {
		autoParse: true,
		rights: {
			create: true,
			read: true,
			update: true,
			delete: true
		}
	};

	const heineken = {
		name: 'Heineken',
		rating: 1
	};

	let server, collection, http;

	t.test('Start REST server (with body parser)', function (t) {
		createServer(t, options, function (_server, _collection, _http) {
			server = _server;
			collection = _collection;
			http = _http;
			t.end();
		});
	});

	t.test('POST /rest/beer (Heineken)', function (t) {
		http.post(t, '/rest/beer', heineken, function (data, res) {
			t.equal(res.statusCode, 201, 'HTTP status 201 (Created)');
			t.ok(res.headers.location, 'Location header returned');

			const id = basename(res.headers.location);
			heineken.id = id;

			t.equal(res.headers.location, '/rest/beer/' + id, 'Location header points to a beer');
			t.deepEqual(heineken, collection.get(id), 'Heineken in collection');

			// now retrieve it
			http.get(t, res.headers.location, function (data, res) {
				t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
				t.deepEqual(data, heineken, 'Heineken retrieved through Location header');
				t.end();
			});
		});
	});

	t.test('Close REST server', function (t) {
		server.close(function () {
			t.end();
		});
	});
});
