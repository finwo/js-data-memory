module.exports = {
  table   : {
    schema: {
      title           : 'table',
      type            : 'object',
      properties      : {
        id         : { type : 'string' },
        code       : { type : 'string' },
        max_chairs : { type : 'integer' }
      }
    },
    relations : {
      hasMany : {
        chair : {
          localField : 'chairs',
          foreignKey : 'table_id'
        },
        guest : {
          localField : 'guests',
          foreignKeys: 'table_ids'
        },
        log : {
          localField : 'logs',
          foreignKey : 'owner_id',
          load       : function (Table, relationDef, table, options) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : table.id},
                owner_type : {'==' : 'table'}
              }
            });
          },
          get        : function (Table, relationDef, table, origGetter) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : table.id},
                owner_type : {'==' : 'table'}
              }
            });
          }
        }
      }
    }
  },
  chair   : {
    schema: {
      title           : 'chair',
      type            : 'object',
      properties      : {
        id       : { type : 'string' },
        code     : { type : 'string' },
        table_id : { type : 'string' },
      }
    },
    relations : {
      belongsTo : {
        table : {
          localField : 'table',
          foreignKey : 'table_id'
        }
      },
      hasOne : {
        guest : {
          localField : 'guest',
          foreignKey : 'chair_id'
        }
      },
      hasMany : {
        log : {
          localField : 'logs',
          foreignKey : 'owner_id',
          load       : function (Chair, relationDef, chair, options) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : chair.id},
                owner_type : {'==' : 'chair'}
              }
            });
          },
          get        : function (Chair, relationDef, chair, origGetter) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : chair.id},
                owner_type : {'==' : 'chair'}
              }
            });
          }
        }
      }
    }
  },
  guest   : {
    schema: {
      title           : 'guest',
      type            : 'object',
      properties      : {
        unique        : { type : 'string' },
        name          : { type : 'string' },
        age           : { type : 'integer' },
        chair_id      : { type : 'string' },
        table_ids  : { 
          type : 'array', 
          items : { type : 'string' }
        },
        lucky_numbers : { 
          type : 'array', 
          items : { type : 'integer' }
        }
      }
    },
    relations : {
      belongsTo : {
        chair : {
          localField : 'chair',
          foreignKey : 'chair_id'
        }
      },
      hasMany : {
        table : {
          localField : 'tables',
          localKeys  : 'table_ids'
        },
        log : {
          localField : 'logs',
          foreignKey : 'owner_id',
          load       : function (Guest, relationDef, guest, options) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : guest.unique},
                owner_type : {'==' : 'guest'}
              }
            });
          },
          get        : function (Guest, relationDef, guest, origGetter) {
            return store.findAll('log', {
              where : {
                owner_id   : {'==' : guest.unique},
                owner_type : {'==' : 'guest'}
              }
            });
          }
        }
      }
    },
    idAttribute     : 'unique',
    idType          : 'string',
  },
  log     : {
    schema: {
      title           : 'log',
      type            : 'object',
      properties      : {
        id         : { type : 'string' },
        time       : { type : 'integer' },
        owner_type : { type : 'string' },
        owner_id   : { type : 'string' }
      }
    },
    relations : {
      belongsTo : {
        owner : {
          localField : 'owner',
          foreignKey : 'owner_id',
          load       : function (Log, relationDef, log, options) {
            return store.find(log.owner_type, log.owner_id);
          },
          get        : function (Log, relationDef, log, origGetter) {
            return store.find(log.owner_type, log.owner_id);
          }
        }
      }
    }
  },
  owner   : {
  },
  example : {
    schema : {
      title      : 'example',
      type       : 'object',
      properties : {
        unique : { type : 'string' },
        value  : { type : 'string' },
      }
    },
    idAttribute : 'unique',
    idType      : 'string',
  }
};
