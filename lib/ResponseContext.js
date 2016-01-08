'use strict';

const getAllowedMethods = require('./getAllowedMethods');
const statusCodes = require('http').STATUS_CODES;
const path = require('path');
const getBaseName = require('path').basename;

function getExt(fileName) {
	const ext = path.extname(fileName || '');

	return ext ? ext.slice(1) : undefined;
}

function isEmpty(obj) {
	if (!obj || typeof obj !== 'object') {
		return true;
	}

	return Object.keys(obj).length === 0;
}


class ResponseContext {
	constructor(responder, fileName, query) {
		// optional HTTP req and res objects
		this.req = responder.req;
		this.res = responder.res;

		// the requested file
		this.fileName = fileName;
		this.ext = getExt(fileName);
		this.baseName = fileName && getBaseName(fileName, '.' + this.ext);

		// parsed query string
		this.query = isEmpty(query) ? undefined : query;

		// access rights
		this.rights = responder.rights;

		// response
		this.status = 500; // Internal server error
		this.statusName = statusCodes[this.status];
		this.headers = {};
		this.body = undefined;
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

		const fnName = method.toLowerCase() + ext[0].toUpperCase() + ext.slice(1);
		if (typeof target[fnName] !== 'function') {
			return;
		}

		const req = this.req;
		const res = this.res;

		return function () {
			target[fnName](req, res);
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
		this.statusName = statusCodes[n];
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
