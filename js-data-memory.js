// Great many thanks to jmdobry
// https://gist.github.com/jmdobry/f51c32746ca5f768c700

var JSData  = require('js-data'),
    Adapter = require('js-data-adapter').Adapter,
    Promise = require('any-promise');

function MemoryAdapter(opts) {
  Adapter.call(this, opts);

  var data = {};

  /**
   * In short: our database table structure
   *
   * @param resource
   */
  function addMetaForResource(resource) {
    if (!(resource.name in data)) {
      data[resource.name]            = {};
      data[resource.name].curId      = 1;
      data[resource.name].index      = {};
      data[resource.name].collection = [];
    }
  }

  /**
   * Create a record
   *
   * @param resource
   * @param attrs
   * @param options
   * @returns {*}
   * @private
   */
  this._create = function (resource, attrs, options) {
    addMetaForResource(resource);
    if (attrs[resource.idAttribute] && data[resource.name].index[attrs[resource.idAttribute]] && options.upsert) {
      return this.update(resource, attrs[resource.idAttribute], attrs, options);
    } else {
      var id = data[resource.name].curId;
      data[resource.name].curId++;
      // TODO: detect if 'id' has to be integer or string to prevent error validation
      attrs[resource.idAttribute]   = id.toString();
      data[resource.name].index[id] = attrs;
      data[resource.name].collection.push(attrs);
      return new Promise(function (resolve, reject) {
        resolve([attrs, {}]);
      });
    }
  };

  /**
   * Create multiple records
   *
   * @param resource
   * @param props
   * @param options
   * @returns {Promise<[any , ...]> | any}
   * @private
   */
  this._createMany = function (resource, props, options) {
    var tasks = [],
        self  = this;
    Object.keys(props).forEach(function (key) {
      tasks.push(self.create(resource, props[key], options))
    });
    return Promise.all(tasks);
  };

  /**
   * Find a single record by ID
   *
   * @param resource
   * @param id
   * @param options
   * @returns {Promise | Promise<any>}
   * @private
   */
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

  /**
   * Find multiple records
   *
   * @param resource
   * @param params
   * @param options
   * @returns {Promise | Promise<any>}
   * @private
   */
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

  /**
   * Update a single record by ID
   *
   * @param resource
   * @param id
   * @param attrs
   * @param options
   * @returns {Promise<any>}
   * @private
   */
  this._update = function (resource, id, attrs, options) {
    addMetaForResource(resource);
    return this.find(resource, id, options).then(function (item) {
      JSData.DSUtils.deepMixIn(item, attrs);
      return [item, {}];
    });
  };

  /**
   * Update multiple records
   *
   * @param resource
   * @param params
   * @param attrs
   * @param options
   * @returns {Promise<any>}
   * @private
   */
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

  /**
   * Destroy a single record by ID
   *
   * @param resource
   * @param id
   * @param options
   * @returns {Promise<any>}
   * @private
   */
  this._destroy = function (resource, id, options) {
    addMetaForResource(resource);
    return this.find(resource, id, options).then(function (item) {
      delete data[resource.name].index[id];
      return [id, {}];
    });
  };

  /**
   * Destroy multiple records
   *
   * @param resource
   * @param params
   * @param options
   * @returns {Promise<any>}
   * @private
   */
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

  this.loadBelongsTo = function (mapper, def, records, __opts) {
    var _this6 = this,
    singular = false;

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      singular = true;
      records = [records];
    }
    
    if (mapper.relations[def.type][def.relation].load) {
  
      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].load({}, {}, record, {})
          .then(function (relatedItems) {
            def.setLocalField(record, relatedItems);
          })
        );
      });
      return Promise.all(p);

    } else {
      
      var relationDef = def.getRelation();

      if (singular) {
        var record = records[0];
        return this.find(relationDef, this.makeBelongsToForeignKey(mapper, def, record), __opts).then(function (relatedItem) {
          def.setLocalField(record, relatedItem);
        });
      } else {
        var keys = [];
        records.forEach(function (record) {
          var key = _this6.makeBelongsToForeignKey(mapper, def, record);
          if (keys.indexOf(key) < 0) keys.push(key);
        });

        var where = {};
        if (keys.length > 1) where[relationDef.idAttribute] = { 'in': keys };
        else                 where[relationDef.idAttribute] = { '==': keys.shift() };
        return this.findAll(relationDef, {where : where}, __opts).then(function (relatedItems) {
          records.forEach(function (record) {
            relatedItems.forEach(function (relatedItem) {
              if (relatedItem[relationDef.idAttribute] === record[def.foreignKey]) {
                def.setLocalField(record, relatedItem);
              }
            });
          });
        });
      }
    }
  },

  this.loadHasMany = function(mapper, def, records, __opts) {
    var _this10 = this,
        singular = false;
  
    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      singular = true;
      records = [records];
    }
    
    if (mapper.relations[def.type][def.relation].load) {
  
      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].load({}, {}, record, {})
          .then(function (relatedItems) {
            def.setLocalField(record, relatedItems);
          })
        );
      });
      return Promise.all(p)

    } else {

      var IDs = records.map(function (record) {
        return _this10.makeHasManyForeignKey(mapper, def, record);
      });
      var query = {
        where: {}
      };

      var criteria = query.where[def.foreignKey] = {};
      if (singular) {
        // more efficient query when we only have one record
        criteria['=='] = IDs[0];
      } else {
        criteria['in'] = IDs.filter(function (id) {
          return id;
        });
      }
      return this.findAll(def.getRelation(), query, __opts).then(function (relatedItems) {
        records.forEach(function (record) {
          var attached = [];
          // avoid unneccesary iteration when we only have one record
          if (singular) {
            attached = relatedItems;
          } else {
            relatedItems.forEach(function (relatedItem) {
              if (JSData.utils.get(relatedItem, def.foreignKey) === record[mapper.idAttribute]) {
                attached.push(relatedItem);
              }
            });
          }
          def.setLocalField(record, attached);
        });
      });
    }
  };
  
  this.loadHasManyLocalKeys = function(mapper, def, records, __opts) {
    var _this11 = this;

    var record = void 0;
    var relatedMapper = def.getRelation();

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      record = records;
    }

    if (record) {
      return this.findAll(relatedMapper, {
        where: defineProperty({}, relatedMapper.idAttribute, {
          'in': this.makeHasManyLocalKeys(mapper, def, record)
        })
      }, __opts).then(function (relatedItems) {
        def.setLocalField(record, relatedItems);
      });
    } else {
      var localKeys = [];
      records.forEach(function (record) {
        localKeys = localKeys.concat(_this11.makeHasManyLocalKeys(mapper, def, record));
      });
      return this.findAll(relatedMapper, {
        where: defineProperty({}, relatedMapper.idAttribute, {
          'in': unique(localKeys).filter(function (x) {
            return x;
          })
        })
      }, __opts).then(function (relatedItems) {
        records.forEach(function (item) {
          var attached = [];
          var itemKeys = JSData.utils.get(item, def.localKeys) || [];
          itemKeys = JSData.utils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
          relatedItems.forEach(function (relatedItem) {
            if (itemKeys && itemKeys.indexOf(relatedItem[relatedMapper.idAttribute]) !== -1) {
              attached.push(relatedItem);
            }
          });
          def.setLocalField(item, attached);
        });
        return relatedItems;
      });
    }
  };
  
  this.loadHasManyForeignKeys = function(mapper, def, records, __opts) {
    var _this12 = this;

    var relatedMapper = def.getRelation();
    var idAttribute = mapper.idAttribute;
    var record = void 0;

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      record = records;
    }

    if (record) {
      return this.findAll(def.getRelation(), {
        where: defineProperty({}, def.foreignKeys, {
          'contains': this.makeHasManyForeignKeys(mapper, def, record)
        })
      }, __opts).then(function (relatedItems) {
        def.setLocalField(record, relatedItems);
      });
    } else {
      return this.findAll(relatedMapper, {
        where: defineProperty({}, def.foreignKeys, {
          'isectNotEmpty': records.map(function (record) {
            return _this12.makeHasManyForeignKeys(mapper, def, record);
          })
        })
      }, __opts).then(function (relatedItems) {
        var foreignKeysField = def.foreignKeys;
        records.forEach(function (record) {
          var _relatedItems = [];
          var id = JSData.utils.get(record, idAttribute);
          relatedItems.forEach(function (relatedItem) {
            var foreignKeys = JSData.utils.get(relatedItems, foreignKeysField) || [];
            if (foreignKeys.indexOf(id) !== -1) {
              _relatedItems.push(relatedItem);
            }
          });
          def.setLocalField(record, _relatedItems);
        });
      });
    }
  };
  
  this.loadHasOne = function(mapper, def, records, __opts) {
    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      records = [records];
    }
    return this.loadHasMany(mapper, def, records, __opts).then(function () {
      records.forEach(function (record) {
        var relatedData = def.getLocalField(record);
        if (JSData.utils.isArray(relatedData) && relatedData.length) {
          def.setLocalField(record, relatedData[0]);
        }
      });
    });
  };

  this.makeHasManyForeignKey = function(mapper, def, record) {
    return def.getForeignKey(record);
  };
  
  this.makeHasManyLocalKeys = function(mapper, def, record) {
    var localKeys = [];
    var itemKeys = JSData.utils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
    localKeys = localKeys.concat(itemKeys);
    return unique(localKeys).filter(function (x) {
      return x;
    });
  };

  this.makeBelongsToForeignKey = function(mapper, def, record) {
    return def.getForeignKey(record);
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