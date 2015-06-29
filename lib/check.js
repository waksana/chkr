var factor = function(check) {
  return function(config) {
    config = config || {};
    if(config.defaultValue) {
      config.defaultValue = check('defaultValue', config.defaultValue, config);
    }
    return function(field) {
      var key = config.field || field;
      if(key in this) {
        return check(key, this[key], config);
      }
      else if('defaultValue' in config) {
        return config.defaultValue;
      }
      else if(config.optional != false) {
        return undefined;
      }
      else {
        throw new Error(key + ' is required!');
      }
    };
  };
};

exports.string = factor(function(key, value, config) {
  if(!(config.regular instanceof RegExp) || config.regular.test(value)) {
    return value;
  }
  else {
    throw new Error(key + ' is not regular!');
  }
});
exports.number = factor(function(key, value, config) {
  if(isNaN(value)) {
    throw new Error(key + ' must be a number');
  }
  else {
    value = Number(value);
    if('number' == typeof config.max && config.max < value) {
      throw new Error(key + ' exceeds the max');
    }
    if('number' == typeof config.min && config.min > value) {
      throw new Error(key + ' exceeds the min');
    }
    return value;
  }
});

exports.boolean = factor(function(key, value) {
  if(value.toString() == 'true') {
    return true;
  }
  else if(value.toString() == 'false') {
    return false;
  }
  throw new Error(key + ' should be true or false');
});

exports.date = factor(function(key, value) {
  var date = new Date(value);
  if(date.toString() == 'Invalid Date') {
    throw new Error(key + ' is not a regular date type');
  }
  return date;
});
