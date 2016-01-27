'use strict';

const getAllowedMethods = require('./getAllowedMethods');
const getBaseName = require('path').basename;

function isEmpty(obj) {
	if (!obj || typeof obj !== 'object') {
		return true;
	}

	return Object.keys(obj).length === 0;
}


class ResponseContext {
	constructor(responder, fileName, ext, query) {
		// optional HTTP req and res objects
		this.req = responder.req;
		this.res = responder.res;

		// the requested file
		this.fileName = fileName;
		this.ext = ext;
		this.baseName = fileName && (ext ? getBaseName(fileName, '.' + ext) : fileName);

		// parsed query string
		this.query = isEmpty(query) ? undefined : query;

		// access rights
		this.rights = responder.rights;

		// response
		this.status = 500; // Internal server error
		this.headers = {};
		this.body = undefined;

		if (this.req && this.req.method !== 'GET' && this.req.method !== 'HEAD') {
			this.headers['cache-control'] = 'max-age=0, no-cache, no-store, must-revalidate';
			this.headers.expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
		}
	}

	isModified(collection/*, resourceId */) {
		// TODO: in the future, check modification time per resource
		if (!this.req || !this.req.headers) {
			return true;
		}

		return collection.isModifiedSince(this.req.headers['if-modified-since']);
	}

	isJson() {
		// extension wins

		if (this.ext) {
			return this.ext === 'json';
		}

		// no extension? assume JSON, regardless of HTTP headers
		return true;
	}

	createCustomFn(method, target) {
		if (!this.req || !this.res) {
			return;
		}

		// eg: getJpeg

		const ext = this.ext || 'json';
		const fn = target[method.toLowerCase() + ext[0].toUpperCase() + ext.slice(1)];

		if (typeof fn !== 'function') {
			return;
		}

		const args = [this.req, this.res];

		return function () {
			for (let i = 0; i < arguments.length; i += 1) {
				args.push(arguments[i]);
			}

			fn.apply(target, args);
		};
	}

	setLocation(id) {
		if (!this.req) {
			return this;
		}

		let url = this.req.originalUrl;  // router base URL
		const index = url.indexOf('?');

		if (index !== -1) {
			url = url.substr(0, index);
		}

		if (id) {
			url += '/' + id;
		}

		this.addHeader('location', url);
		return this;
	}

	setStatus(n) {
		this.status = n;
		return this;
	}

	setError(error) {
		if (error.code) {
			this.addHeader('x-error-code', error.code);
		}

		this.addHeader('content-type', 'text/plain');
		this.body = error.message;
		return this;
	}

	mayRead(resource) {
		return this.rights.read(this.req, this.res, resource);
	}

	mayCreate(resource) {
		return this.rights.create(this.req, this.res, resource);
	}

	mayUpdate(resource) {
		return this.rights.update(this.req, this.res, resource);
	}

	mayDelete(resource) {
		return this.rights.delete(this.req, this.res, resource);
	}

	disallow(resource) {
		if (this.req && this.res && this.rights) {
			const methods = getAllowedMethods(this.req, this.res, this.rights, resource);

			if (methods.length === 0) {
				this.setStatus(404); // Not found
			} else {
				this.setStatus(405); // Method not allowed
				this.addHeader('allow', methods.join(', '));
			}
		} else {
			this.setStatus(404); // Not found
		}
		return this;
	}

	addHeader(name, value) {
		this.headers[name] = value;
		return this;
	}

	setBody(body) {
		this.addHeader('content-type', 'application/json');
		this.body = JSON.stringify(body);
		return this;
	}
}

module.exports = ResponseContext;
