/*global window,assert,suite,setup,teardown,sinon,test*/
/*jshint esnext:true*/

suite('gaia-pages', function() {
  'use strict';

  var GaiaPages = window['gaia-pages'];

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.els = {};

    // DOM container to put test cases
    this.dom = document.createElement('div');
    document.body.appendChild(this.dom);
  });

  teardown(function() {
    this.sinon.restore();
    this.dom.remove();
  });

  suite('matching', function() {
    setup(function() {
      this.dom.innerHTML = `
        <gaia-pages>
          <section data-route="/a"></section>
          <section data-route="/b"></section>
          <section data-route="/c"></section>
        </gaia-pages>`;

      this.el = this.dom.firstElementChild;
      this.els.pages = this.el.querySelectorAll('section');
    });

    test('It matches the correct page when the hash url changes', function() {
      this.el.navigate('/b');
      assert.isTrue(this.els.pages[1].classList.contains('matched'));
      assert.isFalse(this.els.pages[0].classList.contains('matched'));
      assert.isFalse(this.els.pages[2].classList.contains('matched'));

      this.el.navigate('/c');
      assert.isTrue(this.els.pages[2].classList.contains('matched'));
      assert.isFalse(this.els.pages[1].classList.contains('matched'));
      assert.isFalse(this.els.pages[0].classList.contains('matched'));
    });

    test('It fires a `matched` event on the matched page', function(done) {
      this.els.pages[1].addEventListener('matched', () => done());
      this.el.navigate('/b');
    });

    test('It fires a `matched` event on the matched page', function(done) {
      this.el.addEventListener('changed', () => done());
      this.el.navigate('/b');
    });

    test('It fires a `unmatched` event on the matched page', function(done) {
      this.el.navigate('/a');
      this.els.pages[0].addEventListener('unmatched', () => done());
      this.el.navigate('/b');
    });
  });

  suite('nesting', function() {
    setup(function() {
      this.dom.innerHTML = `
        <gaia-pages selector=".group1">
          <section class="group1" data-route="/a"></section>
          <section class="group1" data-route="/b">
            <gaia-pages selector=".group2">
              <section class="group2" data-route="/b/1"></section>
              <section class="group2" data-route="/b/2"></section>
              <section class="group2" data-route="/b/3"></section>
            </gaia-pages>
          </section>
          <section class="group1" data-route="/c"></section>
        </gaia-pages>`;

      this.gaiaPages = this.dom.querySelectorAll('gaia-pages');
      this.els.group1 = this.dom.querySelectorAll('.group1');
      this.els.group2 = this.dom.querySelectorAll('.group2');
    });

    test('It matches multiple pages', function() {
      this.gaiaPages[0].navigate('/b/1');
      this.gaiaPages[1].navigate('/b/1');

      assert.isTrue(this.els.group1[1].classList.contains('matched'));
      assert.isTrue(this.els.group2[0].classList.contains('matched'));
    });
  });

  suite('animations', function() {
    setup(function() {
      this.dom.innerHTML = `
        <gaia-pages>
          <section data-route="/a"></section>
          <section data-route="/b"></section>
          <section data-route="/c"></section>
        </gaia-pages>`;

      this.el = this.dom.firstElementChild;
      this.els.pages = this.el.querySelectorAll('section');
    });

    test('The next page gets `.enter-forward` if later in the order', function() {
      this.el.navigate('/a');
      this.el.navigate('/b');
      assert.isTrue(this.els.pages[1].classList.contains('enter-forward'));
    });

    test('The previous page gets `.leave-back` if earlier in the order', function() {
      this.el.navigate('/a');
      this.el.navigate('/b');
      assert.isTrue(this.els.pages[0].classList.contains('leave-back'));
    });

    test('The next page gets `.enter-back` if earlier in the order', function() {
      this.el.navigate('/b');
      this.el.navigate('/a');
      assert.isTrue(this.els.pages[0].classList.contains('enter-back'));
    });

    test('The previous page gets `.leave-forward` if later in the order', function() {
      this.el.navigate('/b');
      this.el.navigate('/a');
      assert.isTrue(this.els.pages[1].classList.contains('leave-forward'));
    });

    suite('overiding default page order', function() {
      setup(function() {
        this.dom.innerHTML = `
          <gaia-pages>
            <section data-order="3" data-route="/a"></section>
            <section data-order="2" data-route="/b"></section>
            <section data-order="1" data-route="/c"></section>
          </gaia-pages>`;

        this.el = this.dom.firstElementChild;
        this.els.pages = this.el.querySelectorAll('section');
      });

      test('The next page gets `.enter-back` if earlier in the order', function() {
        this.el.navigate('/a');
        this.el.navigate('/b');
        assert.isTrue(this.els.pages[1].classList.contains('enter-back'));

        this.el.navigate('/c');
        assert.isTrue(this.els.pages[2].classList.contains('enter-back'));
      });
    });
  });

  suite('duplicate routes', function() {
    setup(function() {
      this.dom.innerHTML = `
        <gaia-pages manual>
          <section data-route="^\.+$"></section>
          <section data-route="^\.+$"></section>
        </gaia-pages>`;

      this.el = this.dom.firstElementChild;
      this.els.pages = this.el.querySelectorAll('section');
    });

    test('It should alternate between the two pages', function() {
      this.el.navigate('/anything');
      assert.isTrue(this.els.pages[0].classList.contains('matched'));

      this.el.navigate('/any/thing');
      assert.isTrue(this.els.pages[1].classList.contains('matched'));
    });

    test('It ...', function() {
      this.el.navigate('/', { dir: 'forward' });
      assert.isTrue(this.els.pages[0].classList.contains('enter-forward'));

      this.el.navigate('/deeper', { dir: 'forward' });
      assert.isTrue(this.els.pages[1].classList.contains('enter-forward'));
      assert.isTrue(this.els.pages[0].classList.contains('leave-back'));

      this.el.navigate('/deeper/deeper', { dir: 'forward' });
      assert.isTrue(this.els.pages[0].classList.contains('enter-forward'));
      assert.isTrue(this.els.pages[1].classList.contains('leave-back'));

      this.el.navigate('/deeper', { dir: 'back' });
      assert.isTrue(this.els.pages[1].classList.contains('enter-back'));
      assert.isTrue(this.els.pages[0].classList.contains('leave-forward'));
    });
  });

  suite('GaiaPages#navigate()', function() {
    setup(function() {
      this.dom.innerHTML = `
        <gaia-pages>
          <section data-route="^\/$"></section>
          <section data-route="^\/foo$"></section>
          <section data-route="^\/foo\/bar$"></section>
          <section data-route="^\/foo\/bar\/baz$"></section>
        </gaia-pages>`;

      this.el = this.dom.firstElementChild;
      this.els.pages = this.el.querySelectorAll('section');
    });

    test('It should alternate between the two pages', function() {
      this.el.navigate('/');
      assert.isTrue(this.els.pages[0].classList.contains('matched'));

      this.el.navigate('foo');
      assert.isTrue(this.els.pages[1].classList.contains('matched'));

      this.el.navigate('bar');
      assert.isTrue(this.els.pages[2].classList.contains('matched'));

      this.el.navigate('baz');
      assert.isTrue(this.els.pages[3].classList.contains('matched'));

      assert.equal(this.el.history[0], '/');
      assert.equal(this.el.history[1], '/foo');
      assert.equal(this.el.history[2], '/foo/bar');
      assert.equal(this.el.history[3], '/foo/bar/baz');
    });
  });
});
