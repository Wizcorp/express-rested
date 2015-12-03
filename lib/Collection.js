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

		this.save = function (ids, cb) {
			process.nextTick(cb);
		};
	}

	instantiate(id, obj) {
		try {
			return new this.Class(id, obj);
		} catch (error) {
			return undefined;
		}
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
			}

			return cb && cb(error);
		});
	}

	del(id, cb) {
		const previous = this.get(id);

		if (previous) {
			delete this.map[id];

			this.save([id], (error) => {
				if (error) {
					this.map[id] = previous;
				}

				return cb && cb(error);
			});
		} else {
			if (cb) {
				process.nextTick(cb);
			}
		}
	}

	delAll(cb) {
		const previous = this.map;
		const ids = this.getIds();
		this.map = {};
		this.save(ids, (error) => {
			if (error) {
				this.map = previous;
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
