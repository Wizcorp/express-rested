'use strict';


function mapToList(map) {
	const keys = Object.keys(map);
	const len = keys.length;

	const result = new Array(len);
	for (let i = 0; i < len; i++) {
		result[i] = map[keys[i]];
	}

	return result;
}


class Collection {
	constructor(Class) {
		if (typeof Class !== 'function') {
			throw new TypeError('Provided class is not a function (constructor)');
		}

		this.map = {};
		this.Class = Class;

		this.save = function (ids, cb) {
			process.nextTick(cb);
		};
	}

	loadMap(map) {
		this.map = {};

		const keys = Object.keys(map);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];

			this.loadOne(key, map[key]);
		}
	}

	loadOne(id, info) {
		this.map[id] = new this.Class(id, info);
	}

	toJSON() {
		return this.map;
	}

	has(id) {
		return this.map.hasOwnProperty(id);
	}

	get(id) {
		return this.map[id];
	}

	getIds() {
		return Object.keys(this.map);
	}

	getAll() {
		const result = {};
		const keys = Object.keys(this.map);

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			result[key] = this.map[key];
		}

		return result;
	}

	list() {
		return mapToList(this.map);
	}

	set(resource, cb) {
		const id = resource.getId();
		this.map[id] = resource;

		this.save([id], cb);
	}

	setAll(resources, cb) {
		this.map = resources;
		this.save(this.getIds(), cb);
	}

	del(id, cb) {
		if (this.has(id)) {
			delete this.map[id];

			this.save([id], cb);
		} else {
			process.nextTick(cb);
		}
	}

	delAll(cb) {
		const ids = this.getIds();
		this.map = {};
		this.save(ids, cb);
	}

	persist(fn) {
		if (typeof fn !== 'function') {
			throw new TypeError('Persist argument is not a function');
		}

		if (fn.length >= 2) {
			// asynchronous persistence

			this.save = fn;
		} else {
			// synchronous persistence

			this.save = (ids, cb) => {
				try {
					fn.call(this, ids);
				} catch (error) {
					process.nextTick(cb, error);
				}
			};
		}
	}
}


module.exports = Collection;
