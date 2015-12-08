'use strict';

const request = require('http').request;
const parseUrl = require('url').parse;


function serialize(body) {
	if (Buffer.isBuffer(body)) {
		return body;
	}

	return JSON.stringify(body);
}


function respond(t, res, cb) {
	res.setEncoding('utf8');

	let str = '';

	res.on('data', function (chunk) {
		str += chunk;
	});

	res.on('end', function () {
		let result;

		if ((res.headers['content-type'] || '').startsWith('application/json')) {
			if (str.length === 0) {
				// HEAD response?
				return cb(str, res);
			}

			try {
				result = JSON.parse(str);
			} catch (error) {
				t.fail(error);
				return t.end();
			}

			return cb(result, res);
		}

		return cb(str, res);
	});
}


function failer(t) {
	return function (error) {
		if (error) {
			t.fail(error);
			t.end();
		}
	};
}


class HttpClient {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
		this.overrideHeaders = {};
	}

	overrideHeader(name, value) {
		if (value === undefined) {
			delete this.overrideHeaders[name];
		} else {
			this.overrideHeaders[name] = value;
		}
	}

	url(method, path) {
		const url = parseUrl(this.baseUrl);
		url.method = method;
		url.path = path;

		if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
			url.headers = url.headers || {};
			url.headers['content-type'] = 'application/json';
		}

		for (const name in this.overrideHeaders) {
			if (this.overrideHeaders.hasOwnProperty(name)) {
				url.headers[name] = this.overrideHeaders[name];
			}
		}

		return url;
	}

	get(t, path, cb) {
		const req = request(this.url('GET', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.end();
	}

	head(t, path, cb) {
		const req = request(this.url('HEAD', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.end();
	}

	post(t, path, data, cb) {
		const req = request(this.url('POST', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.write(serialize(data));
		req.end();
	}

	put(t, path, data, cb) {
		const req = request(this.url('PUT', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.write(serialize(data));
		req.end();
	}

	patch(t, path, data, cb) {
		const req = request(this.url('PATCH', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.write(serialize(data));
		req.end();
	}

	delete(t, path, cb) {
		const req = request(this.url('DELETE', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.end();
	}
}


module.exports = HttpClient;
