
<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-memory

An in-memory adapter for the JSData Node.js ORM.
Credits to JDobry.

### Installation

    npm install --save js-data js-data-memory

### Usage

```js
var MemoryAdapter = require('js-data-memory');

/*
 *  Create an instance of the adapter
 */
var adapter = new MemoryAdapter();

/*
 *  Register the adapter instance
 */
store.registerAdapter('memory', adapter, { default: true });
```

### JSData Tutorial

Start with the [JSData].

### License

[The MIT License (MIT)]

### Example

```js
var jsData        = require('js-data');
var MemoryAdapter = require('js-data-memory');

/*
 *  Optional
 */
jsData.utils.Promise = require('bluebird');

var adapter = new MemoryAdapter();

var container = new jsData.Container({ mapperDefaults: { } });

container.registerAdapter('memory', adapter, { 'default': true });

container.defineMapper('users');

container
    .count('users')
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });

container
    .create('users',{name: 'name', password: 'password'})
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });


container
    .findAll('users',{where: { password: { '==': 'password'} } })
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });
```
