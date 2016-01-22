'use strict';

const test = require('tape');
const express = require('express');
const rested = require('../lib');


class MyResource {
	constructor(id, info) {
		this.id = id;
		this.info = JSON.parse(JSON.stringify(info));
	}

	createId() {
		this.id = 'foo';
		return this.id;
	}
}


test('Core APIs', function (t) {
	t.test('Collection instances', function (t) {
		const col = rested.createCollection(MyResource);
		t.strictEqual(rested.getCollection('myresource'), col);
		rested.delCollection('myresource');
		t.end();
	});

	t.test('Rest instance', function (t) {
		t.throws(function () {
			rested.route();
		}, 'Argument to rested.route() must be a router');

		const router = new express.Router();
		const route = rested.route(router);
		const col = rested.createCollection(MyResource, {
			persist(ids, cb) {
				cb();
			}
		});

		route(col, { rights: true });
		route(col, 'myresource', { rights: true });
		route(col, '/myresource', { rights: true });

		t.end();
	});

	t.test('Collection requests', function (t) {
		const col = rested.createCollection(MyResource);

		col.request(true).post({ foo: 'bar' }, null, function (context) {
			t.equal(context.status, 201, 'Created');

			col.request(false).get('foo', null, null, function (context) {
				t.equal(context.status, 404, 'Not Found');
				t.end();
			});
		});
	});

	t.test('Collection edge behaviors', function (t) {
		t.throws(function () {
			rested.createCollection('Not a class');
		}, 'Resource class must be a function');

		const col = rested.createCollection(MyResource);

		t.throws(function () {
			col.persist('not a function');
		}, 'Persist must be a function');

		col.del('FooBar', function (error) {
			t.ifError(error, 'Deleting non-existing is not an error');
			t.end();
		});
	});

	t.test('Collection undos', function (t) {
		const col = rested.createCollection(MyResource);

		col.persist(function () {
			throw new Error('Save failure');
		});

		const id = 'abc';
		const resource = new MyResource(id, { a: 'a' });

		col.set(id, resource, function (error) {
			t.ok(error, 'Failed set (create)');
			t.equal(col.has(id), false, 'Failed set (create) was undone');

			col.loadOne(id, resource);

			col.set(id, { b: 'b' }, function (error) {
				t.ok(error, 'Failed set (update)');
				t.deepEqual(col.get(id), resource, 'Failed set (update) was undone');

				t.end();
			});
		});
	});

	t.test('Collection JSON', function (t) {
		const col = rested.createCollection(MyResource);

		col.set('abc', new MyResource('abc', {}));

		t.equal(JSON.stringify(col), '{"abc":{"id":"abc","info":{}}}', 'JSON.stringify(collection) produces valid JSON');

		col.loadMap({
			def: new MyResource('def', {}),
			ghi: {}
		});

		t.end();
	});
});
