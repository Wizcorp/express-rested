'use strict';

const Responder = require('./Responder');
const createRightsTests = require('./createRightsTests');


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
		this.lastModified = Date.now();

		this.save = function (ids, cb) {
			process.nextTick(cb);
		};
	}

	isModifiedSince(date) {
		if (!date) {
			return true;
		}

		if (!(date instanceof Date)) {
			date = new Date(date);
		}

		return this.lastModified > date.getTime();
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
		if (info instanceof this.Class) {
			this.map[id] = info;
		} else {
			this.map[id] = new this.Class(id, info);
		}

		this.lastModified = Date.now();
	}

	toJSON() {
		return this.map;
	}

	request(rights, req, res) {
		return new Responder(this, createRightsTests(rights), req, res);
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

	getMapRef() {
		return this.map;
	}

	getMap() {
		const result = {};
		const keys = Object.keys(this.map);

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			result[key] = this.map[key];
		}

		return result;
	}

	getList() {
		return mapToList(this.map);
	}

	set(id, resource, cb) {
		const previous = this.map[id];
		this.map[id] = resource;

		this.save([id], (error) => {
			if (error) {
				if (previous) {
					this.map[id] = previous;
				} else {
					delete this.map[id];
				}
			} else {
				this.lastModified = Date.now();
			}

			return cb && cb(error);
		});
	}

	setAll(resources, cb) {
		const previous = this.map;
		this.map = resources;

		this.save(this.getIds(), (error) => {
			if (error) {
				this.map = previous;
			} else {
				this.lastModified = Date.now();
			}

			return cb && cb(error);
		});
	}

	del(id, cb) {
		const previous = this.get(id);

		if (!previous) {
			if (cb) {
				process.nextTick(cb);
			}
			return;
		}

		delete this.map[id];

		this.save([id], (error) => {
			if (error) {
				this.map[id] = previous;
			} else {
				this.lastModified = Date.now();
			}

			return cb && cb(error);
		});
	}

	delAll(cb) {
		const ids = this.getIds();
		if (ids.length === 0) {
			if (cb) {
				process.nextTick(cb);
			}
			return;
		}

		const previous = this.map;
		this.map = {};
		this.save(ids, (error) => {
			if (error) {
				this.map = previous;
			} else {
				this.lastModified = Date.now();
			}

			return cb && cb(error);
		});
	}

	unpersist() {
		this.save = function (ids, cb) {
			process.nextTick(cb);
		};
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
