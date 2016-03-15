'use strict'

var gali = require('gali');

var types = {};
var typeReg = /^(\w+)(\!|\?|\:)(.*)$/;
var wordReg = /^\w+$/;

function parseChecker(checkStr) {
  if('string' != typeof checkStr)
    throw new Error(`${checkStr} is not a regular type string`);
  var res = checkStr.match(typeReg);
  if(!res || (res[2] != ':' && res[3] != ''))
    throw new Error(`${checkStr} is not a regular type string`);
  if(!types[res[1]])
    throw new Error(`${res[1]} is not a type`);
  var config = {
    checker: types[res[1]],
    required: (res[2] == '?')? false: true,
  };
  if(res[2] == ':') {
    config['default'] = config.checker(res[3]);
  }
  return config;
}

module.exports = gali(rules => {
  if('object' != typeof(rules) || rules == null)
    throw new Error('need not null object but got ' + typeof(rules));

  return Object.keys(rules).map(key => {
    return Object.assign(parseChecker(rules[key]), {key: key});
  });
}, (rules, data) => Promise.all(rules.map(rule => {
  var key = rule.key;
  var value = data[key];
  if(value != undefined && value != null)
    return rule.checker(value, key, data);
  if('default' in rule) return rule['default'];
  if(!rule.required) return undefined;
  return Promise.reject(new Error(`${key} is required!`));
})).then((values) => {
  var res = {};
  rules.forEach((rule, index) => {
    if(values[index] != undefined && values[index] != null)
      res[rule.key] = values[index];
  });
  return res;
}));

module.exports.type = function(t, fn) {
  var obj = t;
  if('string' == typeof t && 'function' == typeof fn) {
    obj = {};
    obj[t] = fn;
  }
  if('object' != typeof(obj) || obj == null)
    throw new Error('define type in wrong param');

  Object.keys(obj).forEach(key => {
    if(!wordReg.test(key))
      throw new Error(`${key} is not a regular type name`);
    if('function' != typeof obj[key])
      throw new Error('type handler should be a fn');
    types[key] = obj[key];
  });
};
