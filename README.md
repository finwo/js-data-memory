
<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

[![npm](https://img.shields.io/npm/v/js-data-memory.svg?style=flat-square)](https://npmjs.com/package/js-data-memory/)
[![Scrutinizer Build](https://img.shields.io/scrutinizer/build/g/trackthis/js-data-memory.svg?style=flat-square)](https://scrutinizer-ci.com/g/trackthis/js-data-memory/)
[![Scrutinizer](https://img.shields.io/scrutinizer/g/trackthis/js-data-memory.svg?style=flat-square)](https://scrutinizer-ci.com/g/trackthis/js-data-memory/)
[![Scrutinizer Coverage](https://img.shields.io/scrutinizer/coverage/g/trackthis/js-data-memory.svg?style=flat-square)](https://scrutinizer-ci.com/g/trackthis/js-data-memory/)
[![npm](https://img.shields.io/npm/l/js-data-memory.svg?style=flat-square)](https://npmjs.com/package/js-data-memory/)

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

Start with the [JSData](http://api.js-data.io/js-data/).

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

### Contributing

First, look at the [issues page](https://github.com/trackthis/js-data-memory/issues) to ensure your issue isn't already known. If it's not, you can create a new issue with a detailed description of what happened & how to reproduce the unexpected behavior.

If you decide to take on the challenge of fixing a known (or unknown) issue, you can do so by sending in a pull request from your own fork of the project. Once it has been tested and approved, it will be merged into the master branch of the repository.
