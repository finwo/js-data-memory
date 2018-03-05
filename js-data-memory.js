// Great many thanks to jmdobry
// https://gist.github.com/jmdobry/f51c32746ca5f768c700

var JSData  = require('js-data'),
    Adapter = require('js-data-adapter').Adapter;

var unique = function (array) {
  var seen = {};
  var final = [];
  array.forEach(function (item) {
    if (item in seen) {
      return;
    }
    final.push(item);
    seen[item] = 0;
  });
  return final;
};

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

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
      return this._update(resource, attrs[resource.idAttribute], attrs);
    } else {
      var id;
      if (attrs[resource.idAttribute] && !data[resource.name].index[attrs[resource.idAttribute]]) {
        id = attrs[resource.idAttribute];
      } else {
        id = data[resource.name].curId;
        data[resource.name].curId++;
        if (resource.schema && resource.schema.properties && resource.schema.properties[resource.idAttribute]
            && resource.schema.properties[resource.idAttribute].type === 'number') {
          attrs[resource.idAttribute] = Number(id, 10);
        } else {
          attrs[resource.idAttribute] = id.toString();
        }
      }
      data[resource.name].index[id] = attrs;
      data[resource.name].collection.push(attrs);
      return new Promise(function (resolve) {
        resolve([attrs, {}]);
      });
    }
  };

  /**
   * Create multiple records
   *
   * @param resource
   * @param props
   * @returns {Promise<[any , ...]> | any}
   * @private
   */
  this._createMany = function (resource, props) {
    var tasks = [],
        self  = this;
    Object.keys(props).forEach(function (key) {
      tasks.push(self.create(resource, props[key]))
    });
    return Promise.all(tasks)
    .then(function(results) {
      return [results, {}];
    });
  };

  /**
   * Find a single record by ID
   *
   * @param resource
   * @param id
   * @returns {Promise | Promise<any>}
   * @private
   */
  this._find = function (resource, id) {
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
   * @returns {Promise | Promise<any>}
   * @private
   */
  this._findAll = function (resource, params) {
    addMetaForResource(resource);
    return new Promise(function (resolve) {
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
   * @returns {Promise<any>}
   * @private
   */
  this._update = function (resource, id, attrs) {
    addMetaForResource(resource);
    return this.find(resource, id).then(function (item) {
      if (attrs) {
        Object.keys(attrs).forEach(function(key) {
          if (attrs[key] != undefined) {
            item[key] = attrs[key];
          }
        });
        data[resource.name].index[id] = item;
      }
      return [item, {}];
    });
  };

  /**
   * Update multiple records after searching for them
   *
   * @param resource
   * @param attrs
   * @param params
   * @returns {Promise<any>}
   * @private
   */
  this._updateAll = function (resource, attrs, params) {
    addMetaForResource(resource);
    var _this = this;
    return this.findAll(resource, params).then(function (items) {
      var tasks = [];
      items.forEach(function (item) {
        tasks.push(_this.update(resource, item[resource.idAttribute], attrs));
      });
      return Promise.all(tasks)
      .then(function(results) {
        return [results, {}];
      });
    });
  };

  /**
   * Update multiple records
   *
   * @param resource
   * @param records
   * @returns {Promise<any>}
   * @private
   */
  this._updateMany = function (resource, records) {
    addMetaForResource(resource);
    var _this = this;
    var tasks = [];
    records.forEach(function (record) {
      tasks.push(_this.update(resource, record[resource.idAttribute], record));
    });
    return Promise.all(tasks);
  };

  /**
   * Destroy a single record by ID
   *
   * @param resource
   * @param id
   * @returns {Promise<any>}
   * @private
   */
  this._destroy = function (resource, id) {
    addMetaForResource(resource);
    try {
      return this.find(resource, id).then(function (record) {
        if (record) {
          delete data[resource.name].index[id]; 
          data[resource.name].collection = data[resource.name].collection.filter(function (item) {
            return item[resource.idAttribute] != id;
          });
          return [id, {}];
        } else {
          return [false, {}];
        }
      });
    } catch (err) {
      return [false, {}];
    }
  };

  /**
   * Destroy multiple records
   *
   * @param resource
   * @param params
   * @returns {Promise<any>}
   * @private
   */
  this._destroyAll = function (resource, params) {
    addMetaForResource(resource);
    var _this = this;
    return this.findAll(resource, params).then(function (items) {
      var tasks = [];
      items.forEach(function (item) {
        tasks.push(_this.destroy(resource, item[resource.idAttribute]));
      });
      return Promise.all(tasks)
      .then(function(results) {
        return [results, {}];
      });
    });
  };

  /**
   * load BelongsTo standard relations (foreignKey)
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} records 
   * @param {*} __opts 
   */
  this.loadBelongsTo = function (mapper, def, records, __opts) {
    var _this6 = this,
    singular = false;

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      singular = true;
      records = [records];
    }
    
    //check for custom relation functions
    if (mapper.relations[def.type][def.relation].get) {
  
      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].get({}, {}, record, {})
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
          if (keys.indexOf(key) < 0) {
            keys.push(key);
          }
        });

        var where = {};
        if (keys.length > 1) {
          where[relationDef.idAttribute] = { 'in': keys };
        } else {
          where[relationDef.idAttribute] = { '==': keys.shift() };
        }
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
  };

  /**
   * load HasMany standard relation (foreignKey)
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} records 
   * @param {*} __opts 
   */
  this.loadHasMany = function(mapper, def, records, __opts) {
    var _this10  = this,
        singular = false;

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      singular = true;
      records = [records];
    }

    if (mapper.relations[def.type][def.relation].get) {
      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].get({}, {}, record, {})
          .then(function (relatedItems) {
            def.setLocalField(record, relatedItems);
          })
        );
      });
      return Promise.all(p);
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
  
  /**
   * load HasMany relation made by LocalKeys
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} records 
   * @param {*} __opts 
   */
  this.loadHasManyLocalKeys = function(mapper, def, records, __opts) {
    var _this11       = this;
    var record        = false;
    var relatedMapper = def.getRelation();

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      record = records;
    }

    if (record) {
      return _this11.findAll(relatedMapper, { 
        where: defineProperty({}, relatedMapper.idAttribute, { 
          'in': _this11.makeHasManyLocalKeys(mapper, def, record) 
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
  
  /**
   * load HasMany relation made by ForeignKeys
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} records 
   * @param {*} __opts 
   */
  this.loadHasManyForeignKeys = function(mapper, def, records, __opts) {
    var _this12 = this;

    var relatedMapper = def.getRelation();
    var record        = false;

    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      record = records;
    }

    if (record) {
      return _this12.findAll(def.getRelation(), {
        where: defineProperty({}, def.foreignKeys, {
          'contains': _this12.makeHasManyForeignKeys(mapper, def, record)
        })
      }, __opts).then(function (relatedItems) {
        def.setLocalField(record, relatedItems);
      });
    } else {
      var p = [];
      records.forEach(function (record) {
        p.push(_this12.findAll(relatedMapper, {
          where : defineProperty({}, def.foreignKeys, {
            'contains' : _this12.makeHasManyForeignKeys(mapper, def, record)
          })
        }, __opts));
      })
      return Promise.all(p)
      .then(function (relatedItems) {
        records.forEach(function(record, i) {
          def.setLocalField(record, relatedItems[i]);
        });
      });
    }
  };
  
  /**
   * load HasOne standard relation (foreignKey)
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} records 
   * @param {*} __opts 
   */
  this.loadHasOne = function(mapper, def, records, __opts) {
    if (JSData.utils.isObject(records) && !JSData.utils.isArray(records)) {
      records = [records];
    }
    return this.loadHasMany(mapper, def, records, __opts).then(function () {
      records.forEach(function (record) {
        var relatedData = def.getLocalField(record);
        if (JSData.utils.isArray(relatedData) && relatedData.length) {
          def.setLocalField(record, relatedData[0]);
        } else {
          def.setLocalField(record, undefined);
        }
      });
    });
  };

  /**
   * extract keys for HasMany relation made by foreignKeys
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} record 
   */
  this.makeHasManyForeignKey = function(mapper, def, record) {
    return def.getForeignKey(record);
  };
  
  /**
   * extract keys for HasMany relations made by localKeys
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} record 
   */
  this.makeHasManyLocalKeys = function(mapper, def, record) {
    var localKeys = [];
    var itemKeys  = JSData.utils.get(record, def.localKeys) || [];
    itemKeys  = JSData.utils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
    localKeys = localKeys.concat(itemKeys);
    return unique(localKeys).filter(function (x) {
      return x;
    });
  };

  /**
   * extract key for BelongsTo relation
   * 
   * @param {*} mapper 
   * @param {*} def 
   * @param {*} record 
   */
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