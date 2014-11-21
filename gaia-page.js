;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/

/**
 * Dependencies
 */

var component = require('gaia-component');

/**
 * Exports
 */

module.exports = component.register('gaia-page', {
  created: function() {
    this.view = this.firstElementChild;
    this.route = new Route(this.getAttribute('route'));
    this.name = this.getAttribute('name');
  },

  onMatched: function(params) {
    this.classList.add('matched');

    for (var key in params) {
      this.view.setAttribute(key, params[key]);
    }

    this.view.innerHTML = 'page: ' + this.name + '<br/> url-params: ' + JSON.stringify(params, '', ' ');
  },

  onUnmatched: function() {
    this.classList.remove('matched');
  },

  template: `
    <style>
      :host {
        position: absolute;
        left: 0;
        top: 0;

        display: block;
        width: 100%;
        height: 100%;
        padding: 40px;

        opacity: 0;
        transition: opacity 400ms;
      }

      :host.matched {
        opacity: 1
      }

    </style>
  `
});

function Route(pattern) {
  var self = this;
  this.keys = [];
  this.regex = new RegExp(pattern.replace(this.paramRegex, function(match) {
    self.keys.push(match.substr(1));
    return '([^\/\\s]+)';
  }));
}

Route.prototype.paramRegex = /(\:[^\/\s]+)/g;

Route.prototype.match = function(url) {
  var match = this.regex.exec(url);
  var result = {};

  if (!match) return null;

  match.slice(1).forEach(function(value, index) {
    result[this.keys[index]] = value;
  }, this);

  return result;
};

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-page',this));