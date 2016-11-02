'use strict';

const PAGE_AFTER = 'pageAfter';
const PAGE_NUM = 'pageNum';
const PAGE_SIZE = 'pageSize';
const ORDER_BY = 'orderBy';

function getProperties(query) {
	const properties = {
		matchOn: {}
	};
	for (const key in query) {
		if (key === PAGE_SIZE) {
			properties.pageSize = parseInt(query[PAGE_SIZE], 10);
		} else if (key === PAGE_NUM) {
			properties.pageNum = parseInt(query[PAGE_NUM], 10);
		} else if (key === PAGE_AFTER) {
			properties.pageAfter = query[PAGE_AFTER];
		} else if (key === ORDER_BY) {
			properties.orderBy = query[ORDER_BY];
		} else {
			properties.matchOn[key] = query[key];
		}
	}
	return properties;
}

function getOrderByFound(map, properties) {
	let retval = true;
	// Check if the property we are ordering by exists
	for (const key in map) {
		if (map.hasOwnProperty(key)) {
			const orderByFound = map[key][properties.orderBy];
			if (!orderByFound) {
				retval = false;
			}
			break; // We're only going to check the first element in the map
		}
	}
	return retval;
}

function validateProperties(map, properties) {
	let status = 200;

	// Validate pagination
	const hasPageSize = properties.hasOwnProperty('pageSize');
	const pageSizeIsNumber = Number.isInteger(properties.pageSize);
	const pageSizeIsValidValue = properties.pageSize > 0 && properties.pageSize === parseInt(properties.pageSize, 10);
	const hasPageAfter = properties.hasOwnProperty('pageAfter');
	const pageAfterKeyFound = map[properties.pageAfter];
	const hasPageNum = properties.hasOwnProperty('pageNum');
	const pageNumIsNumber = Number.isInteger(properties.pageNum);
	const pageNumIsValidValue = properties.pageNum > 0 && properties.pageNum === parseInt(properties.pageNum, 10);

	if (hasPageSize) {
		if (!pageSizeIsNumber) {
			status = 400; // Bad Request: Not a number
		} else if (!pageSizeIsValidValue) {
			status = 400; // Bad Request: Invalid number
		} else if (hasPageAfter && !pageAfterKeyFound) {
			status = 404; // Not Found: pageAfter not found
		} else if (hasPageNum && !pageNumIsNumber) {
			status = 400; // Bad Request: Not a number
		} else if (hasPageNum && !pageNumIsValidValue) {
			status = 400; // Bad Request: Invalid number
		}
	} else if (hasPageAfter || hasPageNum) {
		status = 400; // Bad Request: Missing pageSize
	}

	// Validate Order By
	const hasOrderBy = properties.hasOwnProperty('orderBy');
	const orderByFound = getOrderByFound(map, properties);

	if (hasOrderBy && !orderByFound) {
		status = 404; // Not Found: orderBy not found
	}

	return status;
}

function getPagination (context, keys, properties) {
	const pagination = {
		startIndex: 0,
		endIndex: keys.length
	};

	if (typeof (properties.pageSize) !== 'undefined') {
		if (typeof (properties.pageAfter) !== 'undefined') {
			pagination.startIndex = keys.indexOf(properties.pageAfter) + 1;
		} else if (typeof (properties.pageNum) !== 'undefined') {
			pagination.startIndex = (properties.pageNum - 1) * properties.pageSize;
		}

		// Only use the calculated page end index if it's smaller than the number of keys
		const pageEndIndex = pagination.startIndex + properties.pageSize;
		if (pagination.endIndex > pageEndIndex) {
			pagination.endIndex = pageEndIndex;
		}
	}
	return pagination;
}

function createResult(map, context, properties, resultMap, resultList) {
	const keys = Object.keys(map);

	const pagination = getPagination(context, keys, properties);

	if (properties.hasOwnProperty('orderBy')) {
		// Sort the keys based on the value of property defined in 'orderBy'
		keys.sort(function (a, b) {
			const valA = map[a][properties.orderBy].toString().toUpperCase();
			const valB = map[b][properties.orderBy].toString().toLocaleUpperCase();
			if (valA < valB) {
				return -1;
			}
			if (valA > valB) {
				return 1;
			}
			return 0;
		});
	} else {
		// By default sort by the id
		keys.sort();
	}

	const hasNoProps = Object.keys(properties.matchOn).length === 0;
	for (let i = pagination.startIndex; i < pagination.endIndex; i++) {
		const id = keys[i];
		const resource = map[id];

		if (context.mayRead(resource) && (hasNoProps || (resource.matches && resource.matches(properties.matchOn)))) {
			if (resultMap) {
				resultMap[id] = resource;
			}
			if (resultList) {
				resultList.push(resource);
			}
		}
	}
}

module.exports = function (collection, context, cb) {
	const fn = context.createCustomFn('get', collection.Class);
	const map = collection.getMapRef();

	const properties = getProperties(context.query);
	const propertyStatus = validateProperties(map, properties);
	if (propertyStatus >= 400) {
		return cb(context.setStatus(propertyStatus)); // Invalid properties in query string
	}

	if (fn) {
		const resultList = [];
		createResult(map, context, properties, null, resultList);
		return fn(resultList);
	}

	if (!context.isJson()) {
		return cb(context.setStatus(415)); // Unsupported Media Type
	}

	if (!context.isModified(collection)) {
		return cb(context.setStatus(304)); // Not Modified
	}

	const resultMap = {};
	createResult(map, context, properties, resultMap, null);
	cb(context.setStatus(200).setBody(resultMap));
};
