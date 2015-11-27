'use strict';

const request = require('http').request;
const parseUrl = require('url').parse;


function respond(t, res, cb) {
	res.setEncoding('utf8');

	let str = '';

	res.on('data', function (chunk) {
		str += chunk;
	});

	res.on('end', function () {
		let result;

		if ((res.headers['content-type'] || '').startsWith('application/json')) {
			try {
				result = JSON.parse(str);
			} catch (error) {
				t.fail(error);
				return t.end();
			}

			return cb(result);
		}

		return cb(str);
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
	}

	url(method, path) {
		const url = parseUrl(this.baseUrl);
		url.method = method;
		url.path += path;

		if (method === 'PUT' || method === 'POST') {
			url.headers = url.headers || {};
			url.headers['content-type'] = 'application/json';
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

	post(t, path, data, cb) {
		const req = request(this.url('POST', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.write(JSON.stringify(data));
		req.end();
	}

	put(t, path, data, cb) {
		const req = request(this.url('PUT', path), function (res) {
			respond(t, res, cb);
		});

		req.on('error', failer(t));
		req.write(JSON.stringify(data));
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
