'use strict';

const ResponseContext = require('./ResponseContext');
const api = {
	collection: {
		delete: require('./operations/collection/delete'),
		get: require('./operations/collection/get'),
		post: require('./operations/collection/post'),
		put: require('./operations/collection/put')
	},
	resource: {
		delete: require('./operations/resource/delete'),
		get: require('./operations/resource/get'),
		patch: require('./operations/resource/patch'),
		put: require('./operations/resource/put')
	}
};


class Responder {
	constructor(collection, rights, req, res) {
		this.collection = collection;
		this.rights = rights;
		this.req = req;
		this.res = res;
	}

	get(file, query, cb) {
		const context = new ResponseContext(this, file, query);

		if (context.baseName) {
			api.resource.get(this.collection, context, cb);
		} else {
			api.collection.get(this.collection, context, cb);
		}
	}

	post(obj, cb) {
		const context = new ResponseContext(this);

		api.collection.post(this.collection, context, obj, cb);
	}

	put(file, obj, cb) {
		const context = new ResponseContext(this, file);

		if (context.baseName) {
			api.resource.put(this.collection, context, obj, cb);
		} else {
			api.collection.put(this.collection, context, obj, cb);
		}
	}

	patch(file, obj, cb) {
		const context = new ResponseContext(this, file);

		api.resource.patch(this.collection, context, obj, cb);
	}

	delete(file, cb) {
		const context = new ResponseContext(this, file);

		if (context.baseName) {
			api.resource.delete(this.collection, context, cb);
		} else {
			api.collection.delete(this.collection, context, cb);
		}
	}
}

module.exports = Responder;
