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
* In URLs, you may refer to resources with or without `.json` extension.
* You can add support for custom file extensions and behavior in your resources.
* You can implement search by adding a single function to your resource class.

**Other characteristics**

* Zero dependencies
* 100% unit test code coverage


## Installation

```sh
npm install --save express-rested
```


## Usage

### Given a resource "Beer"

`resources/Beer.js`

```js
class Beer() {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	createId() {
		this.id = this.name;
		return this.id;
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}
}

module.exports = Beer;
```

### Examples

#### Base example

```js
const app = require('express')();
const rest = require('express-rested')(app);

rest.add(require('./resources/Beer'), '/rest/beers');

app.listen(3000);
```

#### Persisting data

```js
const beers = rest.add(require('./resources/Beer'), '/rest/beers');

beers.loadMap(require('./db/beers.json'));

beers.persist(function (ids, cb) {
	fs.writeFile('./db/beers.json', JSON.stringify(this), cb);
});
```

#### Rights management

```js
rest.add(require('./resources/Beer'), '/rest/beers', {
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
```

#### Using an Express sub-router

```js
const express = require('express');
const app = express();
const router = new express.Router();
const rest = require('express-rested')(router);

app.use('/rest', router);

// not specifying a path means the collection path will become /rest/Beer

rest.add(require('./resources/Beer'));
```

#### Custom file extensions

`resources/Beer.js`

```js
class Beer() {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	createId() {
		this.id = this.name;
		return this.id;
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}

	getJpeg(req, res) {
		res.sendFile('/beer-images/' + this.id + '.jpg');
	}

	putJpeg(req, res) {
		const buffs = [];
		req.on('data', function (buff) { buffs.push(buff); });
		req.on('end', () => {
			require('fs').writeFileSync('/beer-images/' + this.id + '.jpg', Buffer.concat(buffs));
			res.sendStatus(200);
		});
	}

	deleteJpeg(req, res) {
		require('fs').unlinkSync('/beer-images/' + this.id + '.jpg');
		res.sendStatus(200);
	}
}
```

#### Search

`resources/Beer.js`

```js
class Beer() {
	constructor(id, info) {
		this.id = id;
		this.edit(info);
	}

	createId() {
		this.id = this.name;
		return this.id;
	}

	edit(info) {
		this.name = info.name;
		this.rating = info.rating;
	}

	matches(obj) {
		return this.name.indexOf(obj.name) !== -1;
	}
}
```

## Supported REST calls

|           | GET               | POST               | PUT                             | PATCH          | DELETE            |
| --------- | ----------------- | ------------------ | ------------------------------- | -------------- | ----------------- |
| /Beer     | Returns all beers | Creates a new beer | Sets the entire beer collection | Not supported  | Deletes all beers |
| /Beer/123 | Returns a beer    | Not supported      | Creates or updates a beer       | Updates a beer | Deletes a beer    |


## API

Resource types can be declared as any class or constructor function. There are a few APIs however that you must or may
implement for things to work.


### Resource API

Your resource class may expose the following APIs:

**constructor(string|null id, Object info)**

This allows you to load objects into the collection. During a POST, the `id` will be `null`, as it will be assigned at
a later time using `createId()` (see below). If the data in `info` is not what it's supposed to be, you may throw an
error to bail out.

Required for HTTP methods: POST, PUT.

**edit(Object info) (optional)**

This enables updating of the resource value. The `info` argument is like the one in the constructor. If the data in
`info` is not what it's supposed to be, you may throw an error to bail out. To support partial updates (PATCH), please
allow `edit()` to accept a partial object. If you don't want to accept partial objects, please throw an error when you
detect this to be the case.

Required for HTTP method: PUT, PATCH

**createId() -> string (optional)**

Should always return an ID that is fairly unique. It could be a UUID, but a username on a User resource would also be
perfectly fine. It's not the resource's job to ensure uniqueness. ID collisions will be handled gracefully by
express-rested. The `createId()` method **must** store the ID it generates and returns.

Required for HTTP method: POST

**matches(Object obj) -> boolean (optional)**

Implement this function to allow filtering to happen on your resource collection. When the query string in a URL
(eg: `?name=bob`) is passed, this function will be called and the entire parsed query object will be passed. If it does
not return `true`, the resource will not end up in the final collection that is being retrieved.

Required for HTTP method: GET with query string

**getExt(express.Request req, express.Response res) (optional)**

You may replace "Ext" in this method name by any file extension you wish to expose a `GET` endpoint for (eg: `getTxt`).
You will receive the `req` and `res` objects and will have full control over how to parse the request and respond to it.

**putExt(express.Request req, express.Response res) (optional)**

You may replace "Ext" in this method name by any file extension you wish to expose a `PUT` endpoint for (eg: `putTxt`).
You will receive the `req` and `res` objects and will have full control over how to parse the request and respond to it.

**patchExt(express.Request req, express.Response res) (optional)**

You may replace "Ext" in this method name by any file extension you wish to expose a `PATCH` endpoint for (eg:
`patchTxt`). You will receive the `req` and `res` objects and will have full control over how to parse the request and
respond to it.

**deleteExt(express.Request req, express.Response res) (optional)**

You may replace "Ext" in this method name by any file extension you wish to expose a `DELETE` endpoint for (eg:
`deleteTxt`). You will receive the `req` and `res` objects and will have full control over how to parse the request and
respond to it.


**Notes**

No other requirements exist on your resource. That also means that the ID used does not necessarily have to be stored in
an `id` property. It may be called anything. Express-rested will never interact with your resource instances beyond:

* reading the Class/constructor name (when auto-generating URL paths)
* Calling the constructor and methods mentioned above


### Rest library API

Importing the library:

**const rested = require('express-rested');**

This imports the library itself.

**const rest = rested([express.Router restRouter]);**

Instantiates a rest object on which you can create collections for resources.

You may pass an Express router (an Express app, or sub-router) so that routes to the collections you add will
automatically be registered on it. If the router already uses the body-parser middleware to parse JSON, express-rested
will use it. Otherwise it will take care of JSON parsing by itself.

It may make sense to use a sub-router that listens for incoming requests on a URL such as `/rest`. The URLs to our
collections will sit on top of this. While the router is optional, you can imagine it hardly makes sense to use this
library without having it register HTTP routes.

**rest.add(constructor Class[, string path, Object options]) -> Collection**

Creates and returns a collection for objects of type `Class`. If you have set up an Express Router, all routes to this
collection will automatically be registered on it. The `path` you provide will be the sub-path on which all routes
are registered. For example the path `/beer` will sit on top of the base path (eg: `/rest`) and will therefore respond
to HTTP requests to the full route that is `/rest/beer`. If you do not provide a path, the name of the class you provide
will be used (and prefixed with `/`, eg.: `'/Beer'`).

Options (all optional):

* rights: an object, boolean or function that will be applied to all CRUD operations (read on for the applied logic).
* rights.create: a boolean or a function(req, res, resource) that returns a boolean indicating whether or not creation
  of this resource may occur.
* rights.read: a boolean or a function(req, res, resource) that returns a boolean indicating whether or not reading
  of this resource may occur.
* rights.update: a boolean or a function(req, res, resource) that returns a boolean indicating whether or not updating
  of this resource may occur.
* rights.delete: a boolean or a function(req, res, resource) that returns a boolean indicating whether or not deletion
  of this resource may occur.
* persist: a function that will be called after each modification of the collection. See the documentation on `persist`
  below for more information on the function signature.

**rest.get(string className) -> Collection**

Can be used to retrieve an instantiated collection by its class name (case insensitive).


### Resource collection API

**collection.loadMap(Object map)**

Fills up the collection with all objects in the map. The key in the map will be used as the ID. For each object,
`new Class(key, object)` will be called to instantiate the resource.

**collection.loadOne(string id, Object info)**

This instantiates a resource object from `info` and loads it into the collection.

**collection.has(id) -> boolean**

Returns `true` if the collection has a resource for the given `id`, `false` otherwise.

**collection.get(id) -> Class|undefined**

Returns the resource with the given `id` it it exists, `undefined` otherwise.

**collection.getIds() -> string[]**

Returns all IDs in the collection.

**collection.getMap() -> Object**

Returns a copy of the complete map of all resources.

**collection.getList() -> Class[]**

Returns all resources as an array.

**collection.set(string id, Class resource, Function cb)**

Ensures inclusion of the given resource into the collection. Triggers the `persist` callback.

**collection.setAll(Class resources[], Function cb)**

Deletes all resources not given, and creates or updates all resources given in the `resources` array. Triggers the
`persist` callback.

**collection.del(string id, Function cb)**

Deletes a single resource from the collection. Triggers the `persist` callback.

**collection.delAll(Function cb)**

Empties the entire collection. Triggers the `persist` callback.

**collection.persist(function (string ids[], [Function cb]) { })**

Registers a function that will be called on any change to the collection, and is passed an array of IDs that were
affected. If you pass a callback, you will have a chance to do asynchronous operations and return an error on failure.
This error will find its way to the client as an Internal Service Error (500). If you don't pass a callback, you may
still throw an exception to achieve the same.


## License

MIT
