'use strict'

module.exports = {
  string: String,
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
