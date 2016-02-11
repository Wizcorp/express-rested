# express-rested

[![Build Status](https://travis-ci.org/Wizcorp/express-rested.svg?branch=master)](https://travis-ci.org/Wizcorp/express-rested)
[![Coverage Status](https://coveralls.io/repos/Wizcorp/express-rested/badge.svg?branch=master&service=github)](https://coveralls.io/github/Wizcorp/express-rested?branch=master)


## Installation

```sh
npm install --save express-rested
```


## Why express-rested?

### REST in practice

[REST](https://en.wikipedia.org/wiki/Representational_state_transfer) is a great style to create an HTTP API to manage
resources. HTTP methods make it easy to access and manipulate resources based on their URL. There are
[many](http://swagger.io) [solutions](http://raml.org/) out there that allow you to define REST interfaces and play
with them. They're great and definitely have their place, but express-rested comes with some different design goals.

I believe the flexibility that many of these systems provide are actually distracting. The reason why some people prefer
this flexibility is because REST in terms of HTTP is quite loosely defined (if at all). Therefore everyone and their
uncle has an opinion on what it means for an API to be truly RESTful and love spending days having religious debates on
this very topic. I find this a waste of my time, and I hope you agree with me at least on that.

Therefore I reasoned that it would be much more rewarding to just decide on one way to implement a REST interface (more
on this below) and stick with it, end-of-debate. This way we can focus on writing the logic for the resources we want to
manage, instead of spending all our time debating POST vs. PUT, what a URL should look like and which HTTP status codes
should really be returned when. With express-rested, these decisions are simply made for you, and you can move on with
your life. That means this library is absolutely, unapologetically biased. Also, it doesn't care if you don't like it.
It does, however, care about keeping a very strict separation between what it is and isn't responsible for.

### What else will it do for me?

#### Automatic routing

With one line of code, you can expose a collection of resources to your Express app, and thus to the web. It will
automatically register routes for the `HEAD`, `GET`, `POST`, `PUT`, `DELETE` HTTP methods for collections, and the
`HEAD`, `GET`, `PUT`, `PATCH`, `DELETE` methods for resources. That's a lot of bang for your buck.

#### Rights management

Whenever you expose data to the outside world, rights management immediately becomes an issue. While supporting
virtually every useful HTTP method, I believe CRUD methods (Create, Read, Update, Delete) are the best methods to base
rights management on. It doesn't have to be more granular than that, nor any less granular. Express-rested easily helps
you define who is allowed to do what to which resource.

#### Search

Search through HTTP query strings is built right in. So resources a user has the right to access can be filtered any
way you see fit, based on the user's input.

#### Data Persistence

Well it doesn't really persist data at all. But it will tell you exactly when what changed, so that you're able to
persist your resources to your favorite datastore.

#### File formats

By default, resources are serialized into JSON, but you can expose a resource using any file type you want and provide
your own serialization methods.

#### A rich API for in-app access to your data

You can access your resources through collections that you instantiate. These collections have easy to use, powerful
APIs to manipulate the collection, as well as index (for performance) and search for resources.


### Should I trust you?

You don't have to trust me. But you can trust the tests that ship with this library. We make sure to keep 100% code
coverage, and don't have any external dependencies.


## Design Philosophy

- You implement your resources as classes
- You own these resource classes and should give them any API that works well for you
- Resources are collected in "collections"
- The entire collection is always in-memory, but may be persisted to a datastore
- The application can access a collection's resources through the collection's API
- The collection and its resources can be exposed REST-style in Express through a single function call


## Usage

### Given a resource "Beer"

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

#### Search

```js
class Beer() {
  /* ... */

  matches(obj) {
    // obj is the parsed query string of the HTTP request
    return this.name.indexOf(obj.name) !== -1;
  }
}
```

#### Custom file extensions

```js
class Beer() {
  /* ... */

  getJpeg(req, res) {
    res.sendFile('/beer-images/' + this.id + '.jpg');
  }

  putJpeg(req, res) {
    const buffs = [];
    req.on('data', function (buff) { buffs.push(buff); });
    req.on('end', () => {
      fs.writeFileSync('/beer-images/' + this.id + '.jpg', Buffer.concat(buffs));
      res.sendStatus(200);
    });
  }

  deleteJpeg(req, res) {
    fs.unlinkSync('/beer-images/' + this.id + '.jpg');
    res.sendStatus(200);
  }

  static getJson(req, res, beersArray) {
    beersArray.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    res.status(200).send(beersArray);
  }
}
```

#### Creating a collection

```js
const rested = require('express-rested');
const beers = rested.createCollection(require('./resources/Beer'));
```

#### Persisting changes

```js
beers.loadMap(require('./db/beers.json'));

beers.persist(function (ids, cb) {
  fs.writeFile('./db/beers.json', JSON.stringify(beers), cb);
});
```

#### Collection exposure through Express

```js
const app = require('express')();
const route = rested.route(app);

route(beers, '/rest/beers', { rights: true });
```

#### Logging warnings and errors

```js
rested.on('error', console.error);
rested.on('warning', console.error);
```

#### Rights management

```js
route(beers, '/rest/beers', {
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
const rested = require('express-rested');

const app = express();
const router = new express.Router();
const route = rested.route(router);

app.use('/rest', router);

route(beers, '/beers', { rights: true });
```


## HTTP in practice

### Supported HTTP methods

|            | GET               | POST               | PUT                             | PATCH          | DELETE            |
| ---------- | ----------------- | ------------------ | ------------------------------- | -------------- | ----------------- |
| /beers     | Returns all beers | Creates a new beer | Sets the entire beer collection | Not supported  | Deletes all beers |
| /beers/123 | Returns a beer    | Not supported      | Creates or updates a beer       | Updates a beer | Deletes a beer    |

### HTTP status codes

HTTP status codes returned by express-rested:

* Success: 200 (OK), 201 (Created), 204 (No Content)
* User error: 400 (Bad Request), 404 (Not Found), 405 (Method Not Allowed), 415 (Unsupported Media Type)
* Server error: 500 (Internal Server Error)

All 4xx errors are generated by express-rested. All 5xx errors result from user-land code throwing an error or
returning an error to an asynchronous function (like `persist`).

### Errors

Whenever your code throws an error or returns it to a callback, this error is returned to the client as a text/plain
human readable response body. If your error object also has a "code" property, it will be returned as an HTTP response
header called `x-error-code`.

Errors that are thrown by your resources are also emitted as `("warning", error)` on the `rested` object. Other errors
are emitted as `("error", error)` on the `rested` object. Keep in mind that Node will consider an `error` event an
uncaught exception if you are not listening for them, **so register at least an "error" listener**.

### URI Locations

When you know the name of a collection and the ID of a resource, you can reference both. But when you use POST to create
a resource, you don't know the ID of the resource. The HTTP response will contain a `Location` header that will contain
the full path to the newly created resource.


## API

Resource types can be declared as an ES6 class or as a constructor function. There are a few APIs however that you must
or may implement for things to work.

### Your Resource API

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
detect this to be the case. The `edit` method should never write an `id`, as that is the job of the constructor and the optional `createId` method (see below).

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

**static getExt(express.Request req, express.Response res, Object[] resources)**

You may replace "Ext" in this method name by any file extension you wish to expose a `GET` endpoint for (eg: `getTxt`).
You will receive the `req` and `res` objects and will have full control over how to parse the request and respond to it.
The third argument you receive is an array containing all the resources in the collection. If a search query was passed,
the `matches()` method will have run on each resource, and non-matching resources will not be in this array.
Implementing this method can be used not just for alternative extensions, but also if you want to change the output of
how a collection is returned in JSON, for example by simply responding directly with the array (by default a collection
is returned as a key/value lookup object).

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


> Notes
>
> No other requirements exist on your resource. That also means that the ID used does not necessarily have to be stored
> in an `id` property. It may be called anything. Express-rested will never interact with your resource instances
> beyond:
>
> - reading the Class/constructor name (when auto-generating URL paths)
> - Calling the constructor and methods mentioned above


### Express-Rested API

**const rested = require('express-rested');**

This imports the library.

#### Managing collections

**rested.createCollection(constructor Class[, Object options]) -> Collection**

Creates and returns a collection for objects of type `Class`.

Options:

* *persist: Function* A function that will be called after each modification of the collection. See the documentation
  on the `collection.persist` method below for more information on the function signature and usage.

**rested.getCollection(string name) -> Collection|undefined**

Returns the collection with the given class name (case insensitive), or `undefined` if it doesn't exist.

**rested.delCollection(string name)**

Deletes the collection with the given class name (case insensitive) from memory. It does destroy resources, nor will it
call the `persist` function for removal. The method is simply there to let express-rested forget about a collection.
Please do note that if HTTP routes have already been assigned for this collection, calling this function will have no
effect, other than that `getCollection(name)` will no longer return the collection.

#### Registering routes for collections

**rested.route(express.Router restRouter) -> Function**

Instantiates a route function through which you can expose collections on your HTTP server.

You must pass an Express router (an Express app, or sub-router) so that routes to the collections you add will
automatically be registered on it. If the router already uses the body-parser middleware to parse JSON, express-rested
will use it. Otherwise it will take care of JSON parsing by itself.

It may make sense to use a sub-router that listens for incoming requests on a URL such as `/rest`. The URLs to our
collections will sit on top of this.

The function you get back has the following signature:

**route(Collection collection[, string path, Object options])**

This will register all routes to this collection. The `path` you can provide will be the sub-path on which all routes
are registered. For example the path `/beer` will sit on top of the base path (eg: `/rest`) of the router and will
therefore respond to HTTP requests to the full route that is `/rest/beer`. If you do not provide a path, the name of the
class you provide will be used (and prefixed with `/`, eg.: `'/Beer'`).

Options (all optional):

* *rights: object, boolean or function(req, res, resource)* Is applied to all CRUD operations (read on for the logic).
* *rights.create: boolean or function(req, res, resource)* Should be or return a boolean indicating whether or not
  creating this resource is allowed.
* *rights.read: boolean or function(req, res, resource)* Should be or return a boolean indicating whether or not reading
  this resource is allowed.
* *rights.update: boolean or function(req, res, resource)* Should be or return a boolean indicating whether or not
  updating this resource is allowed.
* *rights.delete: boolean or function(req, res, resource)* Should be or return a boolean indicating whether or not
  deleting this resource may occur.

By default, the `rights` option is `false` (secure by default). This means that exposing a collection to Express
requires you to set up the rights for it using these options.

#### Resource collection API

If you want to manually influence a collection's resources, you can use the following methods.

**collection.loadMap(Object map)**

Fills up the collection with all objects in the map. The key in the map will be used as the ID. For each object,
`new Class(key, object)` will be called to instantiate the resource.

**collection.loadOne(string id, Object info)**

This instantiates a resource object from `info` and loads it into the collection.

**collection.has(string id) -> boolean**

Returns `true` if the collection has a resource for the given `id`, `false` otherwise.

**collection.get(string id) -> Class|undefined**

Returns the resource with the given `id` if it exists, `undefined` otherwise.

**collection.getIds() -> string[]**

Returns all IDs in the collection.

**collection.getList() -> Class[]**

Returns all resources as an array.

**collection.getMap() -> Object**

Returns a copy of the complete map of all resources.

**collection.getMapRef() -> Object**

Returns a reference to the complete map of all resources that are inside a collection. **Be careful** not to write to
this object, as it would have likely result in unintended consequences. The most common use-case for this API is to use
this object for read-only serialization purposes.

**collection.set(string id, Class resource, Function cb)**

Ensures inclusion of the given resource into the collection. Triggers the `persist` callback.

**collection.setAll(Class resources[], Function cb)**

Deletes all resources not given, and creates or updates all resources given in the `resources` array. Triggers the
`persist` callback.

**collection.del(string id, Function cb)**

Deletes a single resource from the collection. Triggers the `persist` callback.

**collection.delAll(Function cb)**

Empties the entire collection. Triggers the `persist` callback.

**collection.addIndex(string propertyName)**

Creates an index for all resources, current and future, in the collection. The property name you pass will be inspected
on every resource that enters the collection, and indexed on that. The value of of the property may be of any type.

This allows you to do quick indexed searches (or rather, lookups) in a collection. In the beer-example above, you could
for example create an index on the "rating" property. Using the `findOne` and `findAll` methods documented below, you
can then start fetching these resources.

> Note 1: Creating an index is a heavy operation, so it's best done before adding/loading resources into a collection

> Note 2: Indexes are not used in HTTP operations. They are only useful when directly interfacing with your collection

**collection.delIndex(string propertyName)**

Removes a previously created index from the collection.

**collection.findOne(string propertyName, mixed value)**

Will return a single resource that holds the given value for the given property. If no resource matches, `undefined` is
returned.

**collection.findAll(string propertyName, mixed value) -> Class[]**

Will return all resources that hold the given value for the given property. If no resources match, `[]` is returned.

**collection.persist(function (string ids[], [Function cb]) { })**

Registers a function that will be called on any change to the collection, and is passed an array of IDs that were
affected. You can use this to write changes to a database. If you pass a callback, you will have a chance to do
asynchronous operations and return an error on failure. If you don't pass a callback, you may throw an exception to
achieve the same.

Errors find their way to the HTTP client as an Internal Server Error (500). Error also have the automatic effect that
changes made in the collection will be automatically rolled back.


## Debugging

When you want to see which routes are activated by incoming requests, you can enable a debug logger by running your
application with the `NODE_DEBUG=rested` environment variable set.


## License

MIT
