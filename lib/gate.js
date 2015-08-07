'use strict'
var debug = require('util').debuglog('koa-gate');

var Router = require('koa-router');
var util = require('util');
var path = require('path');
var assemble = require('./assemble');
var methodMap = {
  'create': 'post',
  'query': 'get',
  'update': 'put',
  'read': 'get',
  'remove': 'delete'
};
var methods = Object.keys(methodMap);

var Gate = module.exports = function() {
  this.router = new Router();
};

Gate.check = assemble.command;

Gate.prototype.resource = function(doc, controller) {
  if(!controller)
    throw new Error(`controller of ${doc} is not defined`);
  var id = path.basename(doc);
  if(id[0] != ':')
    throw new Error(`basename of ${doc} should be a variable`);
  var coll = path.dirname(doc);
  var self = this;
  methods.forEach(function(method) {
    var p = doc;
    if(method == 'query' || method == 'create')
      p = coll;
    var fn = controller[method];
    if('function' == typeof fn)
      self.route(`${methodMap[method]} ${p}`, fn);
  });
};

Gate.prototype.route = function(cmd, fn) {
  cmd = cmd.split(' ');
  var args = annotate(fn);
  var checkers = this._checkers;
  this.router[cmd[0]](cmd[1], function *() {
    var data = {};
    util._extend(data, this.request.body);
    util._extend(data, this.query);
    util._extend(data, this.params);
    data.method = this.method;
    var params = yield assemble(data, args);
    this.body = yield fn.apply(this, params);
  });
};

Gate.prototype.middleware = function() {
  return this.router.routes();
};

function annotate(fn) {
  var str = fn.toString();
  return str.slice(str.indexOf('(') + 1, str.indexOf(')')).match(/([^\s,]+)/g) || [];
}
