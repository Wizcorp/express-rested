'use strict';

const Responder = require('./Responder');


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

		this.indexProperties = [];
		this.lookupIndex = {};
		this.reverseLookupIndex = new Map();

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

	loadOne(id, obj) {
		let resource;

		if (obj instanceof this.Class) {
			resource = obj;
		} else {
			resource = new this.Class(id, obj);
		}

		this.map[id] = resource;
		this.lastModified = Date.now();
		this.indexResource(resource);
	}

	toJSON() {
		return this.map;
	}

	request(rights, req, res) {
		return new Responder(this, rights, req, res);
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
				this.indexResource(resource);
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
				this.clearAllIndexes();
				this.indexAllResources();
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
				this.unindexResource(previous);
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
				this.clearAllIndexes();
			}

			return cb && cb(error);
		});
	}

	addIndex(propertyName) {
		if (this.lookupIndex[propertyName]) {
			throw new Error('Index on property "' + propertyName + '" already exists');
		}

		this.clearAllIndexes();

		this.lookupIndex[propertyName] = new Map();
		this.indexProperties.push(propertyName);

		this.indexAllResources();
	}

	delIndex(propertyName) {
		if (!this.lookupIndex[propertyName]) {
			throw new Error('Index on property "' + propertyName + '" does not exist');
		}

		this.clearAllIndexes();

		delete this.lookupIndex[propertyName];

		const index = this.indexProperties.indexOf(propertyName);
		if (index !== -1) {
			this.indexProperties.splice(index, 1);
		}

		this.indexAllResources();
	}

	indexResource(resource) {
		if (this.reverseLookupIndex.has(resource)) {
			return;
		}

		const reverse = [];
		this.reverseLookupIndex.set(resource, reverse);

		for (let i = 0; i < this.indexProperties.length; i += 1) {
			const propertyName = this.indexProperties[i];
			const value = resource[propertyName];
			const map = this.lookupIndex[propertyName];

			let entries = map.get(value);

			if (!entries) {
				entries = [];
				map.set(value, entries);
			}

			entries.push(resource);
			reverse.push(entries);
		}
	}

	unindexResource(resource) {
		const indexes = this.reverseLookupIndex.get(resource) || [];

		this.reverseLookupIndex.delete(resource);

		for (let i = 0; i < indexes.length; i += 1) {
			const entries = indexes[i];
			const index = entries.indexOf(resource);

			if (index !== -1) {
				entries.splice(index, 1);
			}
		}
	}

	indexAllResources() {
		const keys = Object.keys(this.map);
		for (let i = 0; i < keys.length; i += 1) {
			this.indexResource(this.map[keys[i]]);
		}
	}

	clearAllIndexes() {
		for (let i = 0; i < this.indexProperties.length; i += 1) {
			const propertyName = this.indexProperties[i];
			this.lookupIndex[propertyName].clear();
		}

		this.reverseLookupIndex.clear();
	}

	findOne(propertyName, value) {
		const map = this.lookupIndex[propertyName];
		if (!map) {
			throw new Error('An index on property "' + propertyName + '" does not exist');
		}

		const resources = map.get(value);
		if (resources) {
			return resources[0];
		}

		return undefined;
	}

	findAll(propertyName, value) {
		const map = this.lookupIndex[propertyName];
		if (!map) {
			throw new Error('An index on property "' + propertyName + '" does not exist');
		}

		const resources = map.get(value);
		if (resources) {
			return resources.slice();
		}

		return [];
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
