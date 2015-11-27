'use strict';

const Rest = require('./lib/Rest');

module.exports = function (router) {
	return new Rest(router);
};
