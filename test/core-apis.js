'use strict';

const test = require('tape');
const express = require('express');
const Rest = require('../lib/Rest');


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
	t.test('Rest instance', function (t) {
		const rest = new Rest(express());
		rest.add(MyResource);
		rest.add(MyResource, { rights: true });
		rest.add(MyResource, '/foo');
		rest.add(MyResource, 'foo2', {
			rights: false,
			persist(ids, cb) {
				cb();
			}
		});
		t.end();
	});

	t.test('Collection requests', function (t) {
		const rest = new Rest();
		const col = rest.add(MyResource);

		t.strictEqual(rest.get('myresource'), col, 'Collection can be retrieved');

		col.request(true).post({ foo: 'bar' }, function (context) {
			t.equal(context.status, 201, 'Created');

			col.request(false).get('foo', function (context) {
				t.equal(context.status, 404, 'Not Found');
				t.end();
			});
		});
	});

	t.test('Collection edge behaviors', function (t) {
		const rest = new Rest();
		const col = rest.add(MyResource);

		t.throws(function () {
			rest.add('Not a class');
		}, 'Resource class must be a function');

		t.throws(function () {
			col.persist('not a function');
		}, 'Persist must be a function');

		col.del('FooBar', function (error) {
			t.ifError(error, 'Deleting non-existing is not an error');
			t.end();
		});
	});

	t.test('Collection undos', function (t) {
		const rest = new Rest();
		const col = rest.add(MyResource);

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
		const rest = new Rest();
		const col = rest.add(MyResource);

		col.set('abc', new MyResource('abc', {}));

		t.equal(JSON.stringify(col), '{"abc":{"id":"abc","info":{}}}', 'JSON.stringify(collection) produces valid JSON');

		col.loadMap({
			def: new MyResource('def', {}),
			ghi: {}
		});

		t.end();
	});
});
