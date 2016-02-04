'use strict';

const log = require('util').debuglog('rested');

const getAllowedMethods = require('./getAllowedMethods');
const getExt = require('path').extname;
const getBaseName = require('path').basename;
const rested = require('./index.js');


function cleanExt(ext) {
	if (!ext) {
		return undefined;
	}

	return ext[0] === '.' ? ext.slice(1) : ext;
}


class ResponseContext {
	constructor(req, res, rights) {
		// optional HTTP req and res objects
		this.req = req;
		this.res = res;

		// the requested file
		const fileName = getBaseName(req.path); // still URL encoded
		const ext = getExt(fileName);           // we don't expect extensions to have URL encoding
		const query = Object.keys(req.query).length === 0 ? undefined : req.query;

		this.ext = cleanExt(ext);
		this.baseName = decodeURIComponent(getBaseName(fileName, ext));
		this.query = query;

		// access rights
		this.rights = rights;

		// response
		this.status = 500; // Internal server error
		this.headers = {};
		this.body = undefined;

		// disable cache for all methods but GET and HEAD
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			this.headers['cache-control'] = 'max-age=0, no-cache, no-store, must-revalidate';
			this.headers.expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
		}
	}

	isModified(collection/*, resourceId */) {
		// TODO: in the future, check modification time per resource
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
		// eg: getJpeg

		const ext = this.ext || 'json';
		const fn = target[method.toLowerCase() + ext[0].toUpperCase() + ext.slice(1)];

		if (typeof fn !== 'function') {
			return;
		}

		const req = this.req;
		const res = this.res;

		return function () {
			const args = [req, res];

			for (let i = 0; i < arguments.length; i += 1) {
				args.push(arguments[i]);
			}

			try {
				fn.apply(target, args);
			} catch (error) {
				rested.emit('error', error);

				if (!res.headersSent) {
					res.writeHead(500);
				}
				res.end();
			}
		};
	}

	setLocation(id) {
		let url = this.req.originalUrl;  // router base URL
		const index = url.indexOf('?');

		if (index !== -1) {
			url = url.substr(0, index);
		}

		if (id) {
			url += '/' + encodeURIComponent(id);
		}

		this.addHeader('location', url);
		return this;
	}

	setStatus(n, error) {
		this.status = n;

		if (error) {
			if (n >= 500) {
				rested.emit('error', error);
			} else {
				rested.emit('warning', error);
			}
		}

		if (error && error.code) {
			this.addHeader('x-error-code', error.code);
		}

		if (n >= 400) {
			this.addHeader('content-type', 'text/plain');

			if (n >= 500) {
				this.body = 'Internal Server Error';
			} else if (error) {
				this.body = error.message;
			}
		}

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
		const methods = getAllowedMethods(this.req, this.res, this.rights, resource);

		if (methods.length === 0) {
			this.setStatus(404); // Not found
		} else {
			this.setStatus(405); // Method not allowed
			this.addHeader('allow', methods.join(', '));
		}

		log('Access to', this.req.url, 'denied. Allowed methods:', methods);

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

	respond() {
		this.res.status(this.status);
		this.res.set(this.headers);
		this.res.end(this.body);
	}
}

module.exports = ResponseContext;
