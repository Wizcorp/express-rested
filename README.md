# express-rested

REST is a great way to create an HTTP API to manage resources. It's however a poor API to do rights management on top
on. Rights management is often based on CRUD (Create, Read, Update, Delete). A REST PUT operation however can mean
either create or update, depending on the resource already existing or not. The REST rules are simple to follow, but
when adding any logic, can be a bit of a pain. This module helps you get around that.

**In essence:**

* This module does not require you to set up any routes to manage your resources, it's all done for you.
* You have full control over rights management (CRUD style).
* You have full control over how (if) data should persist.
* Any object can be a resource, you register its constructor (or ES6 class).
* The resource classes you define can be used in browser as well as in Node.js, so you can write universal JavaScript.
* Resources are always sent back to the client in JSON format.


## Installation

```sh
npm install --save express-rested
```


## Example

`resources/Beer.js`

```js
class Beer() {
	constructor(id, info) {
		this.setId(id);
		this.edit(info);
	}

	setId(id) {
		this.id = id;
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}
}

module.exports = Beer;
```

`index.js`

```js
// dependency joy

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const rested = require('express-rested');

const app = express();
const restRouter = new express.Router();

app.use(bodyParser.json());
app.use('/api/rest', restRouter);

const rest = rested(restRouter);

// Declare a resource class

const Beer = require('./resources/Beer');

// Create a beers collection and define user access rights

const beers = rest.add('/beer', Beer, {
	rights: {
		read: true,     // anybody can read
		delete: false,  // nobody can delete
		create: function (req, res, resource) {
			return res.locals.isAdmin;  // admins can create
		},
		update: function (req, res, resource) {
			return res.locals.isAdmin;  // admins can update
		}
	}
});

// Storage logic

beers.persist(function () {
	const str = JSON.stringify(this.getAll());
	fs.writeFileSync('beers.json', str);
});
```

> For more examples, have a look at the unit tests in the /test folder


## Supported REST calls

|           | GET               | POST               | PUT                        | DELETE            |
| --------- | ----------------- | ------------------ | -------------------------- | ----------------- |
| /beer     | Returns all IDs   | Creates a new beer | Not (yet) supported        | Deletes all beers |
| /beer/123 | Returns a beer    | Not supported      | Creates or replaces a beer | Deletes a beer    |


## Rules for resources

### A resource's constructor(id, info) MUST accept an ID and a value with information

* `id`: This will often be undefined, since the ID will be set through setId or createId (see below), but when given it
  must be set on the object.
* `info`: This will often be an object, but can be any value that is passed as a PUT/POST body.

### A resource MAY have an edit(info) method that accepts the same object with information

* `info`: Like the constructor's info value. This will often be an object, but can be any value that is passed as a
  PUT/POST body.

### A resource MUST have a getId() method

* This method should return the ID of the resource.

### A resource MUST have a createId() OR a setId(id) method

* `createId()` must self-create an ID and store it on the resource. A typical example would be to use a UUID, or a
  unique trait of the object itself (like a username). `getId()` *must* respond with this value.
* `setId(id)` can alternatively be exposed to allow PUT calls to define the ID for a new object. This method too must
  store the value on the resource. `getId()` *must* respond with this value.


## License

MIT
