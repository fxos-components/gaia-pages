;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/

var component = require('gaia-component');

module.exports = component.register('gaia-pages', {
  created: function() {
    addEventListener('DOMContentLoaded', e => this.parseUrl());
    addEventListener('hashchange', e => this.parseUrl());
  },

  parseUrl: function() {
    this.exec(this.getUrl());
  },

  getUrl: function() {
    return location.hash.substr(1);
  },

  exec: function(url) {
    var pages = this.children;
    var i = 0;
    var route;
    var match;
    var page;

    while (!match) {
      page = pages[i++];
      route = page && page.route;
      match = route && route.match(url);
      if (!page) break;
    }

    if (match) this.onPageMatched(page, match);
  },

  onPageMatched: function(page, params) {
    if (this.current) this.current.onUnmatched();
    page.onMatched(params);
    this.current = page;
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

    </style>
  `
});





});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-pages',this));