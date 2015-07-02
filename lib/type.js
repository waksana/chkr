var hash = require('object-hash');
var checkers = {
  string: function(field, value, config) {
    if(!(config.regular instanceof RegExp) || config.regular.test(value)) {
      return value;
    }
    throw new Error(field + ' is not regular!');
  },
  number: function(field, value, config) {
    if(isNaN(value)) throw new Error(field + ' is not a number');
    value = Number(value);
    if('number' == typeof config.max && config.max < value) {
      throw new Error(field + ' exceeds the max');
    }
    if('number' == typeof config.min && config.min > value) {
      throw new Error(field + ' exceeds the min');
    }
    return value;
  },
  boolean: function(field, value, config) {
    if(value.toString() == 'true') {
      return true;
    }
    else if(value.toString() == 'false') {
      return false;
    }
    throw new Error(field + ' should be true or false');
  },
  date: function(field, value) {
    var date = new Date(value);
    if(date.toString() == 'Invalid Date')
      throw new Error(field + 'is not a valid datetype');
    return date;
  }
};

var typeNames = Object.keys(checkers);
var cacheFun = {};
//TODO the cache is not so good because hash is too long

module.exports = function(config) {
  config = config || {}
  config.optional = config.optional != false;
  if(typeNames.indexOf(config.type) < 0)
    config.type = 'string';
  var checker = checkers[config.type];
  if('defaultValue' in config)
    config.defaultValue = checker('defaultValue', config.defaultValue, config);
  var fun, key = hash(config);
  if(!(fun = cacheFun[key])) {
    fun = cacheFun[key] = function(data, field) {
      if(data[field] != undefined && data[field] != null)
        return checker(field, data[field], config);
      if('defaultValue' in config) return config.defaultValue;
      if(config.optional) return undefined;
      throw new Error(field + ' is required!');
    };
  }
  return fun;
};
