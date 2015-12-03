'use strict';

const getAllowedMethods = require('./getAllowedMethods');
const statusCodes = require('http').STATUS_CODES;


class ResponseContext {
	constructor(responder) {
		this.req = responder.req;
		this.res = responder.res;
		this.rights = responder.rights;
		this.status = 500; // Internal server error
		this.statusName = statusCodes[this.status];
		this.headers = {};
		this.body = undefined;
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
