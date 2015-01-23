;(function(define){define(function(require,exports,module){
/*jshint esnext:true*/

/**
 * Dependencies
 */

var component = require('gaia-component');

/**
 * Simple debug logger
 *
 * @return {Function}
 */
var debug = 0 ? console.log.bind(console) : function() {};

/**
 * Exports
 */

module.exports = component.register('gaia-pages', {
  created: function() {
    this.addEventListener('animationend', e => onAnimationEnd(e));
    addEventListener('hashchange', e => this.parseUrl());
    this.setup();
    debug('created');
  },

  setup: function() {
    this.setupRoutes();
    this.parseUrl();
    this.classList.add('no-animations');
    setTimeout(() => { this.classList.remove('no-animations'); });
  },

  setupRoutes: function() {
    this.selector = this.getAttribute('selector') || '[data-route]';
    this.pages = [].slice.call(this.querySelectorAll(this.selector));
    this.routes = this.pages.map(page => this.createRoute(page));
    this.routes.sort((a, b) =>  b.specificity - a.specificity);
    debug('routes setup', this.routes);
  },

  createRoute: function(page, index) {
    debug('create route', page, index);
    var pattern = page.dataset.route;
    var media = page.getAttribute('route-media');
    var route = new Route(pattern);

    // Bolt on some additional bits
    route.matchMedia = media ? window.matchMedia(media) : { matches: true };
    route.fallback = page.getAttribute('route-fallback');
    route.page = page;

    page.route = route;
    page.order = index;

    return route;
  },

  parseUrl: function() {
    this.exec(this.getUrl());
  },

  getUrl: function() {
    return location.hash.substr(1) || '/';
  },

  navigate: function(path) {
    location.hash = '#' + path;
  },

  exec: function(url) {
    debug('exec', url);
    var matched;
    var match;
    var route;

    for (var i = 0, l = this.routes.length; i < l; i++) {
      route = this.routes[i];
      debug('checking route', route);
      match = route.match(url);
      if (!match) continue;
      if (!route.matchMedia.matches) return this.navigate(route.fallback);
      matched = true;
      break;
    }

    if (matched) this.onMatched(route.page, match);

    this.deselectLinks();
    this.url = url;
    this.selectLinks();
  },

  onMatched: function(el, params) {
    debug('on matched', el, params);
    var prev = { el: this.current };
    var next = { el: el };
    var unchanged = next.el === prev.el;

    next.order = Number(next.el.dataset.order || this.pages.indexOf(next.el));
    prev.order = prev.el
      ? Number(prev.el.dataset.order || this.pages.indexOf(prev.el))
      : -1;

    // Determine direction
    next.direction = next.order > prev.order ? 'forward' : 'back';
    prev.direction = next.direction === 'forward' ? 'back' : 'forward';

    // Unmatch prev page
    if (prev.el && !unchanged) {
      prev.el.classList.add('leave-' + prev.direction);
      prev.el.classList.remove('matched');
      prev.el.setAttribute('aria-hidden', 'true');
      prev.el.dispatchEvent(new CustomEvent('unmatched', { bubbles: false }));
    }

    // Match next page
    if (!unchanged) {
      next.el.classList.add('enter-' + next.direction);
      next.el.classList.add('matched');
      next.el.removeAttribute('aria-hidden');
      next.el.dispatchEvent(new CustomEvent('matched', {
        detail: { params: params },
        bubbles: false
      }));
    }

    this.current = next.el;
  },

  deselectLinks: function() {
    [].forEach.call(this.links || [], el => el.classList.remove('selected'));
    this.links = null;
  },

  selectLinks: function() {
    this.links = document.querySelectorAll('a[href="#' + this.url + '"]');
    [].forEach.call(this.links, el => el.classList.add('selected'));
  },

  template: `
    <content></content>

    <style>

      :host {
        position: relative;
        width: 100%;
        height: 100%;

        display: block;
        overflow: hidden;
      }

      ::content [data-route] {
        position: absolute;
        left: 0;
        top: 0;

        display: block;
        width: 100%;
        height: 100%;
        overflow: auto;

        animation-duration: 10000ms;
        animation-fill-mode: forwards;
        animation-timing-function: ease-out;
        pointer-events: none;
        opacity: 0;
      }

      :host(.no-animations) ::content [data-route] {
        animation-duration: 0s !important;
      }

      ::content [data-route].matched,
      ::content .enter-forward,
      ::content .leave-forward,
      ::content .enter-back,
      ::content .leave-back {
        opacity: 1;
      }

      ::content [data-route].matched {
        pointer-events: auto;
      }

      ::content .enter-forward {
        animation-name: page-enter-right;
      }

      ::content .enter-back {
        animation-name: page-enter-left;
      }

      ::content .leave-forward {
        animation-name: page-enter-right;
        animation-timing-function: ease-in;
        animation-direction: reverse;
      }

      ::content .leave-back {
        animation-name: page-enter-left;
        animation-timing-function: ease-in;
        animation-direction: reverse;
      }

      :host-context([dir=rtl]) ::content .enter-forward {
        animation-name: page-enter-left !important;
      }

      :host-context([dir=rtl]) ::content .enter-back {
        animation-name: page-enter-right !important;
      }

      :host-context([dir=rtl]) ::content .leave-forward {
        animation-name: page-enter-left !important;
        animation-timing-function: ease-in;
        animation-direction: reverse;
      }

      :host-context([dir=rtl]) ::content .leave-back {
        animation-name: page-enter-right !important;
        animation-timing-function: ease-in;
        animation-direction: reverse;
      }
    </style>
  `,

  globalCss: `
    @keyframes page-enter-right {
      0% { transform: translateX(100%); }
      100% { transform: translateX(0%); }
    }

    @keyframes page-enter-left {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(0%); }
    }
  `
});

/**
 * Initialize a `Route` from a
 * route pattern string
 *
 * @param {String} pattern
 */
function Route(pattern) {
  var self = this;
  this.keys = [];
  this.specificity = (pattern.match(/(?:\/)[\:\w]+/g) || []).length;
  this.regex = new RegExp(pattern.replace(this.paramRegex, (match) => {
    self.keys.push(match.substr(1));
    return '([^\/\\s]+)';
  }));
}

/**
 * Picks our dynamic params from
 * route pattern string.
 *
 * Example
 *
 *   'some/routes/have/:dynamic/parts'
 *
 * @type {RegExp}
 */
Route.prototype.paramRegex = /(\:[^\/\s]+)/g;

/**
 * Match this route pattern
 * regex against a given url.
 *
 * @param  {String} url
 * @return {Object|null}
 */
Route.prototype.match = function(url) {
  var match = this.regex.exec(url);
  var result = {};
  if (!match) return null;
  match.slice(1).forEach((value, i) => result[this.keys[i]] = value);
  return result;
};

/**
 * Utils
 */

function onAnimationEnd(e) {
  e.target.classList.remove(
     'enter-forward',
     'enter-back',
     'leave-forward',
     'leave-back');
}

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('gaia-pages',this));