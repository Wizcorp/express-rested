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
// Dependency joy

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const rested = require('express-rested');

const app = express();
app.use(bodyParser.json());

// Create a dedicated router for our rest endpoint

const restRouter = new express.Router();
app.use('/api/rest', restRouter);

// Instantiate express-rested with the router

const rest = rested(restRouter);

// Declare a resource class

const Beer = require('./resources/Beer');

// Create a beers collection and define user access rights

const beers = rest.add(Beer, {
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

// Load up the collection

beers.loadMap(require('./db/beers.json'));

// Storage logic

beers.persist(function (ids, cb) {
	const str = JSON.stringify(this.getAll());
	fs.writeFile('./db/beers.json', str, cb);
});
```

> For more examples, have a look at the unit tests in the /test folder


## Supported REST calls

|           | GET               | POST               | PUT                             | DELETE            |
| --------- | ----------------- | ------------------ | ------------------------------- | ----------------- |
| /beer     | Returns all IDs   | Creates a new beer | Sets the entire beer collection | Deletes all beers |
| /beer/123 | Returns a beer    | Not supported      | Creates or updates a beer       | Deletes a beer    |


## API

Resource types can be declared as any class or constructor function. There are a few APIs however that you must or may
implement for things to work.


### Resource API

Your resource class may expose the following APIs:

**constructor(string|null id, Object info)**

This allows you to load objects into the collection. During a POST, the `id` may be `null`. The ID (regardless of
whether it is a string or `null`) should always be returned as-is by getId() (see below).

Required for HTTP methods: POST, PUT.

**edit(Object info) (optional)**

This enables updating of the resource value. The `info` argument is like the one in the constructor.

Required for HTTP method: PUT

**setId(string id) (optional)**

This should store an ID on the resource.

Required for HTTP method: PUT

**getId() -> string|null (optional)**

Should always return the current ID of the resource.

Required for HTTP methods: GET, POST, PUT

**createId() -> string (optional)**

Should always return an ID that is fairly unique. It could be a UUID, but a username on a User resource would also be
perfectly fine. It's not the resource's job to ensure uniqueness. ID collisions will be handled gracefully by
express-rested. The `createId()` method also does not have to store the ID it generates.

Required for HTTP method: POST


### Rest library API

Importing the library:

**const rested = require('express-rested');**

This imports the library itself.

**const rest = rested([express.Router restRouter]);**

Instantiates a rest object on which you can create collections for resources.

Make sure that the express router you want to use has the JSON body parser enabled. Else we won't be able to receive
data. Also, ensure that it listens for incoming requests on a reasonable base URL (such as `/rest`). The URLs to our
collections will sit on top of this. The router is optional, but as you can imagine it hardly makes sense to use this
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

**collection.getAll() -> Object**

Returns a copy of the complete map of all resources.

**collection.list() -> Class[]**

Returns all resources as an array.

**collection.set(Class resource, Function cb)**

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
