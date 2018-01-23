// Great many thanks to jmdobry
// https://gist.github.com/jmdobry/f51c32746ca5f768c700

var JSData  = require('js-data'),
    Adapter = require('js-data-adapter').Adapter,
    Promise = require('any-promise');

function MemoryAdapter(opts) {
  Adapter.call(this, opts);

  var data = {};

  function addMetaForResource(resource) {
    if (!(resource.name in data)) {
      data[resource.name]            = {};
      data[resource.name].curId      = 1;
      data[resource.name].index      = {};
      data[resource.name].collection = [];
    }
  }

  this._create = function (resource, attrs, options) {
    addMetaForResource(resource);
    if (attrs[resource.idAttribute] && data[resource.name].index[attrs[resource.idAttribute]] && options.upsert) {
      return this.update(resource, attrs[resource.idAttribute], attrs, options);
    } else {
      var id = data[resource.name].curId;
      data[resource.name].curId++;
      attrs[resource.idAttribute]   = id;
      data[resource.name].index[id] = attrs;
      data[resource.name].collection.push(attrs);
      return new Promise(function (resolve, reject) {
        resolve([attrs, {}]);
      });
    }
  };

  this._createMany = function (resource, props, options) {
    var tasks = [],
        self  = this;
    Object.keys(props).forEach(function (key) {
      tasks.push(self.create(resource, props[key], options))
    });
    return Promise.all(tasks);
  };

  this._find = function (resource, id, options) {
    addMetaForResource(resource);
    return new Promise(function (resolve, reject) {
      if (data[resource.name].index[id]) {
        resolve([data[resource.name].index[id], {}]);
      } else {
        reject('Not Found!');
      }
    });
  };

  this._findAll = function (resource, params, options) {
    addMetaForResource(resource);
    return new Promise(function (resolve, reject) {
      var _query = new JSData.Query({
        index: {
          getAll: function () {
            return data[resource.name].collection;
          }
        }
      });
      resolve([_query.filter(params).run(), {}]);
    });
  };

  this._update = function (resource, id, attrs, options) {
    addMetaForResource(resource);
    return this.find(resource, id, options).then(function (item) {
      JSData.DSUtils.deepMixIn(item, attrs);
      return [item, {}];
    });
  };

  this._updateAll = function (resource, params, attrs, options) {
    addMetaForResource(resource);
    return this.findAll(resource, params, options).then(function (items) {
      var tasks = [];
      JSData.DSUtils.forEach(items, function (item) {
        tasks.push(_this.update(resource, item[resource.idAttribute], attrs, options));
      });
      return Promise.all(tasks);
    });
  };

  this._destroy = function (resource, id, options) {
    addMetaForResource(resource);
    return this.find(resource, id, options).then(function (item) {
      JSData.DSUtils.remove(data[resource.name].collection, item);
      delete data[resource.name].index[id];
      return [id, {}];
    });
  };

  this._destroyAll = function (resource, params, options) {
    addMetaForResource(resource);
    var _this = this;
    return this.findAll(resource, params, options).then(function (items) {
      var tasks = [];
      items.forEach(function (item) {
        tasks.push(_this.destroy(resource, item[resource.idAttribute], options));
      });
      return Promise.all(tasks);
    });
  };
}

MemoryAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value       : MemoryAdapter,
    enumerable  : false,
    writable    : true,
    configurable: true
  }
});

Object.defineProperty(MemoryAdapter, '__super__', {
  configurable: true,
  value       : Adapter
})

module.exports = MemoryAdapter;