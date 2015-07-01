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

module.exports = function(config) {
  if(!config || 'string' != typeof config.field)
    throw new Error('field is required');
  var optional = config.optional != false;
  var checker = checkers[config.type] || checkers.string;
  if('defaultValue' in config)
    config.defaultValue = checker('defaultValue', config.defaultValue, config);
  return function(data) {
    field = config.field;
    if(field in data) return checker(field, data[field], config);
    if('defaultValue' in config) return config.defaultValue;
    if(optional) return undefined;
    throw new Error(field + ' is required!');
  };
};
