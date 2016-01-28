'use strict';

const test = require('tape');
const rested = require('..');
const Beer = require('./helpers/Beer');


test('Indexes', function (t) {
	const collection = rested.createCollection(Beer);

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
		name: 'De Molen - Hop en Liefde',
		rating: 5
	};

	const all = {
		Heineken: heineken,
		SuntoryPremium: suntory,
		Rochefort: rochefort,
		DeMolen: demolen
	};


	t.test('Index on empty collection', function (t) {
		collection.addIndex('rating');

		t.throws(function () {
			collection.addIndex('rating');
		}, 'Cannot create existing index');

		collection.delIndex('rating');

		t.throws(function () {
			collection.delIndex('rating');
		}, 'Cannot delete non-existing index');

		t.throws(function () {
			collection.findOne('bob', 2);
		});

		t.throws(function () {
			collection.findAll('bob', 2);
		});

		t.end();
	});

	t.test('Index on non-empty collection', function (t) {
		collection.loadMap(all);
		collection.addIndex('rating');

		const target = [collection.get('DeMolen'), collection.get('Rochefort')];

		const foundOne = collection.findOne('rating', 5);
		t.notEqual(target.indexOf(foundOne), -1, 'Rating 5 resource found');

		const foundAll = collection.findAll('rating', 5).sort(function (a, b) {
			return a.id.localeCompare(b.id);
		});

		t.equal(foundAll.length, 2, 'Found 2 beers with rating 5');
		t.equal(foundAll[0], target[0], 'Found DeMolen');
		t.equal(foundAll[1], target[1], 'Found Rochefort');

		let foundNone = collection.findOne('rating', 200);
		t.equal(foundNone, undefined, 'findOne returns undefined');

		foundNone = collection.findAll('rating', 200);
		t.deepEqual(foundNone, [], 'findAll returns []');

		collection.del('DeMolen', function () {
			const foundAll = collection.findAll('rating', 5);

			t.equal(foundAll.length, 1, 'Found 1 beer with rating 5');
			t.equal(foundAll[0], target[1], 'Found Rochefort');

			collection.delIndex('rating');
			t.end();
		});
	});
});
