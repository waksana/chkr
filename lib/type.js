'use strict'
var crypto = require('crypto');

var checkers = {
  string: function(value) {
    return value;
  },
  number: function(value) {
    if(isNaN(value)) throw new Error('not a number');
    return Number(value);
  },
  boolean: function(value) {
    if(value.toString() == 'true') {
      return true;
    }
    else if(value.toString() == 'false') {
      return false;
    }
    throw new Error('not a boolean');
  },
  date: function(value) {
    var date = new Date(value);
    if(date.toString() == 'Invalid Date')
      throw new Error('not a datetype');
    return date;
  }
};

var cacheFun = {};
var typeReg = /^(string|boolean|date|number)(\!|\?|\:)(.*)$/

function getConfig(type) {
  var res = type.match(typeReg);
  if(!res || (res[2] != ':' && res[3] != ''))
    throw new Error('can not parse the type string');
  var config = {
    checker: checkers[res[1]],
    optional: (res[2] == '?')? true: false,
  };
  if(res[2] == ':')
    config.defaultValue = config.checker(res[3]);
  return config;
}

function getKey(type) {
  var md5 = crypto.createHash('md5');
  var key = md5.update(type).digest('base64');
  if(type.length > key.length) return key;
  return type;
};

module.exports = function(type) {
  var fun, key = getKey(type);
  if(!(fun = cacheFun[key])) {
    var config = getConfig(type);
    fun = cacheFun[key] = function(data, field) {
      if(data[field] != undefined && data[field] != null) {
        try {
          var value = config.checker(data[field]);
        }
        catch(e) {
          throw new Error(field + ' is ' + e.message);
        }
        return value;
      }
      if('defaultValue' in config) return config.defaultValue;
      if(config.optional) return undefined;
      throw new Error(field + ' is required!');
    };
  }
  return fun;
};
