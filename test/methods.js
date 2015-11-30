'use strict';

const test = require('tape');
const createServer = require('./helpers/server');

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

	t.test('Start REST server', function (t) {
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

	t.test('POST /rest/beer (Heineken)', function (t) {
		http.post(t, '/beer', heineken, function (data) {
			heineken.id = heineken.name;

			t.deepEqual(data, heineken, 'Heineken returned');
			t.deepEqual(data, collection.get(data.id), 'Heineken in collection');
			t.end();
		});
	});

	t.test('POST /rest/beer (Rochefort)', function (t) {
		http.post(t, '/beer', rochefort, function (data) {
			rochefort.id = rochefort.name;

			t.deepEqual(data, rochefort, 'Rochefort returned');
			t.deepEqual(data, collection.get(data.id), 'Rochefort in collection');
			t.end();
		});
	});

	t.test('GET /beer/Heineken', function (t) {
		http.get(t, '/beer/Heineken', function (data) {
			t.deepEqual(data, heineken, 'Heineken returned');
			t.deepEqual(data, collection.get('Heineken'), 'Heineken in collection');
			t.end();
		});
	});

	t.test('PUT /beer/SuntoryPremium', function (t) {
		http.put(t, '/beer/SuntoryPremium', suntory, function (data) {
			suntory.id = 'SuntoryPremium';

			t.deepEqual(data, suntory, 'Suntory returned');
			t.deepEqual(data, collection.get(data.id), 'Suntory in collection');
			t.end();
		});
	});

	t.test('GET /beer', function (t) {
		http.get(t, '/beer', function (data) {
			data.sort();
			t.deepEqual(data, ['Heineken', 'Rochefort', 'SuntoryPremium'], 'All 3 beer IDs returned');
			t.deepEqual(data, collection.getIds().sort(), 'All 3 beers in collection');
			t.end();
		});
	});

	t.test('PUT /beer', function (t) {
		http.put(t, '/beer', all, function () {
			t.deepEqual(collection.getAll(), all, 'Replaced entire collection');
			t.end();
		});
	});

	t.test('PUT /beer', function (t) {
		http.put(t, '/beer', allButSuntory, function () {
			t.deepEqual(collection.getAll(), allButSuntory, 'Replaced entire collection (Suntory is out)');
			t.end();
		});
	});

	t.test('DELETE /beer/Heineken', function (t) {
		http.delete(t, '/beer/Heineken', function () {
			t.deepEqual([demolen.id, rochefort.id], collection.getIds().sort(), 'Heineken is out');
			t.end();
		});
	});

	t.test('DELETE /beer', function (t) {
		http.delete(t, '/beer', function () {
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
