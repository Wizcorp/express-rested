'use strict';

const test = require('tape');
const createServer = require('./helpers/server');
const basename = require('path').basename;


test('Methods', function (t) {
	const options = {
		rights: {
			create: true,
			read: true,
			update: true,
			delete: true
		}
	};

	let server, collection, http;

	t.test('Start REST server (without body parser)', function (t) {
		createServer(t, options, function (_server, _collection, _http) {
			server = _server;
			collection = _collection;
			http = _http;
			t.end();
		});
	})

	const heineken = {
		name: 'Heineken',
		rating: 1
	};

	const suntory = {
		name: 'Suntory Premium',
		rating: 4
	};

	const rochefort = {
		name: 'Rochefort',
		rating: 5
	};

	const demolen = {
		id: 'DeMolen',
		name: 'De Molen - Hop en Liefde',
		rating: 5
	};

	const all = {
		'Heineken': heineken,
		'SuntoryPremium': suntory,
		'Rochefort': rochefort,
		'DeMolen': demolen
	};

	const allButSuntory = {
		'Heineken': heineken,
		'Rochefort': rochefort,
		'DeMolen': demolen
	};

	const allButDeMolen = {
		'Heineken': heineken,
		'SuntoryPremium': suntory,
		'Rochefort': rochefort
	};

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

	t.test('POST /rest/beer (Rochefort)', function (t) {
		http.post(t, '/rest/beer', rochefort, function (data, res) {
			t.equal(res.statusCode, 201, 'HTTP status 201 (Created)');
			t.ok(res.headers.location, 'Location header returned');

			const id = basename(res.headers.location);
			rochefort.id = id;

			t.equal(res.headers.location, '/rest/beer/' + id, 'Location header points to a beer');
			t.deepEqual(rochefort, collection.get(id), 'Rochefort in collection');
			t.end();
		});
	});

	t.test('GET /rest/beer/Heineken', function (t) {
		http.get(t, '/rest/beer/Heineken', function (data, res) {
			t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
			t.deepEqual(data, heineken, 'Heineken returned');
			t.deepEqual(data, collection.get('Heineken'), 'Heineken in collection');
			t.end();
		});
	});

	t.test('PUT /rest/beer/SuntoryPremium', function (t) {
		http.put(t, '/rest/beer/SuntoryPremium', suntory, function (data, res) {
			t.equal(res.statusCode, 201, 'HTTP status 201 (Created)');
			t.ok(res.headers.location, 'Location header returned');

			const id = basename(res.headers.location);
			suntory.id = id;

			t.equal(res.headers.location, '/rest/beer/' + id, 'Location header points to a beer');
			t.deepEqual(suntory, collection.get(id), 'Suntory in collection');
			t.end();
		});
	});

	t.test('PUT /rest/beer/SuntoryPremium (update)', function (t) {
		suntory.rating = 4.5;

		http.put(t, '/rest/beer/SuntoryPremium', suntory, function (data, res) {
			t.equal(res.statusCode, 204, 'HTTP status 204 (No Content)');
			t.ok(res.headers.location, 'Location header returned');
			t.equal(res.headers.location, '/rest/beer/' + suntory.id, 'Location header points to a beer');
			t.deepEqual(suntory, collection.get(suntory.id), 'Suntory in collection');
			t.end();
		});
	});

	t.test('GET /rest/beer', function (t) {
		http.get(t, '/rest/beer', function (data, res) {
			t.equal(res.statusCode, 200, 'HTTP status 200 (OK)');
			t.deepEqual(data, allButDeMolen, 'All beers but De Molen returned');
			t.end();
		});
	});

	t.test('PUT /rest/beer', function (t) {
		http.put(t, '/rest/beer', all, function (data, res) {
			t.equal(res.statusCode, 204, 'HTTP status 204 (No Content)');
			t.deepEqual(collection.getMap(), all, 'Replaced entire collection');
			t.end();
		});
	});

	t.test('PUT /rest/beer', function (t) {
		http.put(t, '/rest/beer', allButSuntory, function (data, res) {
			t.equal(res.statusCode, 204, 'HTTP status 204 (No Content)');
			t.deepEqual(collection.getMap(), allButSuntory, 'Replaced entire collection (Suntory is out)');
			t.end();
		});
	});

	t.test('DELETE /rest/beer/Heineken', function (t) {
		http.delete(t, '/rest/beer/Heineken', function (data, res) {
			t.equal(res.statusCode, 204, 'HTTP status 204 (No Content)');
			t.deepEqual([demolen.id, rochefort.id], collection.getIds().sort(), 'Heineken is out');
			t.end();
		});
	});

	t.test('DELETE /rest/beer', function (t) {
		http.delete(t, '/rest/beer', function (data, res) {
			t.equal(res.statusCode, 204, 'HTTP status 204 (No Content)');
			t.deepEqual([], collection.getIds(), 'All beers are gone');
			t.end();
		});
	});

	t.test('Close REST server', function (t) {
		server.close(function () {
			t.end();
		});
	})
});
