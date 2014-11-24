;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/

var component = require('gaia-component');

module.exports = component.register('gaia-pages', {
  created: function() {
    this.pages = [].slice.call(this.querySelectorAll('[route]'));
    this.addEventListener('animationend', e => this.onAnimationEnd(e));
    addEventListener('DOMContentLoaded', e => this.parseUrl());
    addEventListener('hashchange', e => this.parseUrl());
    this.routes = this.pages.map(page => this.createRoute(page));
    this.routes.sort(route =>  0 - route.specificity);
  },

  createRoute: function(page) {
    var route = new Route(page.getAttribute('route'));
    route.page = page;
    page.route = route;
    return route;
  },

  parseUrl: function() {
    this.exec(this.getUrl());
  },

  getUrl: function() {
    return location.hash.substr(1);
  },

  exec: function(url) {
    var i = 0;
    var match;
    var route;

    while (!match) {
      route = this.routes[i++];
      if (!route) break;
      match = route.match(url);
    }

    if (match) this.onMatched(route.page, match);
  },

  onMatched: function(page, params) {
    var pageUnchanged = page === this.current;
    var previousOrder = this.current ? this.current.getAttribute('order') : -1;
    var order = page.getAttribute('order');
    var forward = Number(order) > Number(previousOrder);
    var newPageDirection = forward ? 'forward' : 'back';
    var oldPageDirection = forward ? 'back' : 'forward';

    if (this.current && !pageUnchanged) {
      this.current.classList.add('leave-' + oldPageDirection);
      this.current.removeAttribute('matched');
    }

    page.params = params;

    if (!pageUnchanged) {
      page.classList.add('enter-' + newPageDirection);
      page.setAttribute('matched', '');
    }

    this.current = page;
  },

  onAnimationEnd: function(e) {
    e.target.classList.remove(
      'enter-forward',
      'enter-back',
      'leave-forward',
      'leave-back');
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
      }

      ::content > *:not(style) {
        position: absolute;
        left: 0;
        top: 0;

        display: block;
        width: 100%;
        height: 100%;
      }

    </style>
  `
});

function Route(pattern) {
  var self = this;
  this.keys = [];
  this.specificity = (pattern.match(/\//g) || []).length;
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
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-pages',this));