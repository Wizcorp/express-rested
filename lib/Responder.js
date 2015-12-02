'use strict';

const ResponseContext = require('./ResponseContext');
const getOne = require('./operations/getOne');
const getAll = require('./operations/getAll');
const postOne = require('./operations/postOne');
const putOne = require('./operations/putOne');
const putAll = require('./operations/putAll');
const deleteOne = require('./operations/deleteOne');
const deleteAll = require('./operations/deleteAll');


class Responder {
	constructor(collection, rights, req, res) {
		this.collection = collection;
		this.rights = rights;
		this.req = req;
		this.res = res;
	}

	get(id, cb) {
		const context = new ResponseContext(this);

		if (id) {
			getOne(this.collection, context, id, cb);
		} else {
			getAll(this.collection, context, cb);
		}
	}

	post(data, cb) {
		const context = new ResponseContext(this);

		postOne(this.collection, context, data, cb);
	}

	put(id, data, cb) {
		const context = new ResponseContext(this);

		if (id) {
			putOne(this.collection, context, id, data, cb);
		} else {
			putAll(this.collection, context, data, cb);
		}
	}

	delete(id, cb) {
		const context = new ResponseContext(this);

		if (id) {
			deleteOne(this.collection, context, id, cb);
		} else {
			deleteAll(this.collection, context, cb);
		}
	}
}

module.exports = Responder;
