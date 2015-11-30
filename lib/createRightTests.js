'use strict';

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function boolToFn(value) {
	return value ? returnTrue : returnFalse;
}

function valueToFn(value) {
	if (typeof value === 'boolean') {
		return boolToFn(value);
	}

	if (typeof value === 'function') {
		return value;
	}

	return returnFalse;
}


module.exports = function (rights) {
	if (rights && typeof rights === 'object') {
		return {
			create: valueToFn(rights.create),
			read: valueToFn(rights.read),
			update: valueToFn(rights.update),
			delete: valueToFn(rights.delete)
		};
	}

	rights = valueToFn(rights);

	return {
		create: rights,
		read: rights,
		update: rights,
		delete: rights
	};
};
