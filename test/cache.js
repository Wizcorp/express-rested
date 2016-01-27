'use strict';

const test = require('tape');
const createServer = require('./helpers/server');


test('HTTP cache', function (t) {
	const options = { rights: true };

	let server, collection, http;

	const heineken = {
		name: 'Heineken',
		rating: 1
	};

	t.test('Start REST server', function (t) {
		createServer(t, options, function (_server, _collection, _http) {
			server = _server;
			collection = _collection;
			http = _http;

			collection.loadOne('Heineken', heineken);
			heineken.id = 'Heineken';

			t.end();
		});
	});

	t.test('GET /rest/beer/Heineken (no cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Sun, 06 Nov 1994 08:49:37 GMT');

		http.get(t, '/rest/beer/Heineken', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
			t.equal(res.headers['content-type'], 'application/json', 'JSON response');
			t.deepEqual(data, heineken, 'Heineken returned');
			t.end();
		});
	});

	t.test('GET /rest/beer (no cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Sun, 06 Nov 1994 08:49:37 GMT');

		http.get(t, '/rest/beer', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
			t.equal(res.headers['content-type'], 'application/json', 'JSON response');
			t.deepEqual(data, { Heineken: heineken }, 'Heineken returned');
			t.end();
		});
	});

	t.test('GET /rest/beer/Heineken (cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Wed, 06 Nov 2080 08:49:37 GMT');

		http.get(t, '/rest/beer/Heineken', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 304, 'HTTP status 304 (Not Modified)');
			t.equal(data, '', 'No response body');
			t.end();
		});
	});

	t.test('GET /rest/beer (cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Wed, 06 Nov 2080 08:49:37 GMT');

		http.get(t, '/rest/beer', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 304, 'HTTP status 304 (Not Modified)');
			t.equal(data, '', 'No response body');
			t.end();
		});
	});

	t.test('HEAD /rest/beer/Heineken (no cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Sun, 06 Nov 1994 08:49:37 GMT');

		http.head(t, '/rest/beer/Heineken', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
			t.equal(res.headers['content-type'], 'application/json', 'JSON response');
			t.equal(data, '', 'No response body');
			t.end();
		});
	});

	t.test('HEAD /rest/beer/Heineken (cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Wed, 06 Nov 2080 08:49:37 GMT');

		http.head(t, '/rest/beer/Heineken', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 304, 'HTTP status 304 (Not Modified)');
			t.equal(data, '', 'No response body');
			t.end();
		});
	});

	t.test('DELETE /rest/beer/Heineken (disabled cache)', function (t) {
		http.overrideHeader('if-modified-since', 'Wed, 06 Nov 2080 08:49:37 GMT');

		http.delete(t, '/rest/beer/Heineken', function (data, res) {
			http.overrideHeader('if-modified-since');

			t.equal(res.statusCode, 204, 'HTTP status 204 (No content)');
			t.ok(res.headers['cache-control'], 'Cache-Control header is set');
			t.ok(res.headers.expires, 'Expires header is set');

			if (res.headers['cache-control']) {
				t.notEqual(res.headers['cache-control'].indexOf('no-cache'), -1, 'Cache-Control contains "no-cache"');
				t.notEqual(res.headers['cache-control'].indexOf('no-store'), -1, 'Cache-Control contains "no-store"');
			}

			if (res.headers.expires) {
				t.ok(new Date(res.headers.expires) < new Date(), 'Expires header is in the past');
			}

			t.end();
		});
	});



	t.test('Close REST server', function (t) {
		server.close(function () {
			t.end();
		});
	});
});
