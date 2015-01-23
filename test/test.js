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

    // Stubing this method is far simpler
    // than attempting to stub window.location
    this.sinon.stub(GaiaPages.prototype, 'getUrl').returns('/a');
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

    test('It matches the pages of the current url when creatd', function() {
      assert.isTrue(this.els.pages[0].classList.contains('matched'));
    });

    test('It matches the correct page when the hash url changes', function() {
      navigate('/b');
      assert.isTrue(this.els.pages[1].classList.contains('matched'));
      assert.isFalse(this.els.pages[0].classList.contains('matched'));
      assert.isFalse(this.els.pages[2].classList.contains('matched'));

      navigate('/c');
      assert.isTrue(this.els.pages[2].classList.contains('matched'));
      assert.isFalse(this.els.pages[1].classList.contains('matched'));
      assert.isFalse(this.els.pages[0].classList.contains('matched'));
    });

    test('It fires a `matched` event on the matched page', function(done) {
      this.els.pages[1].addEventListener('matched', () => done());
      navigate('/b');
    });

    test('It fires a `unmatched` event on the matched page', function(done) {
      this.els.pages[0].addEventListener('unmatched', () => done());
      navigate('/b');
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

      this.el = this.dom.firstElementChild;
      this.els.group1 = this.el.querySelectorAll('.group1');
      this.els.group2 = this.el.querySelectorAll('.group2');
    });

    test('It matches multiple pages', function() {
      navigate('/b/1');
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
      navigate('/b');
      assert.isTrue(this.els.pages[1].classList.contains('enter-forward'));
    });

    test('The previous page gets `.leave-back` if earlier in the order', function() {
      navigate('/b');
      assert.isTrue(this.els.pages[0].classList.contains('leave-back'));
    });

    test('The next page gets `.enter-back` if earlier in the order', function() {
      navigate('/b');
      navigate('/a');
      assert.isTrue(this.els.pages[0].classList.contains('enter-back'));
    });

    test('The previous page gets `.leave-forward` if later in the order', function() {
      navigate('/b');
      navigate('/a');
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
        navigate('/b');
        assert.isTrue(this.els.pages[1].classList.contains('enter-back'));

        navigate('/c');
        assert.isTrue(this.els.pages[2].classList.contains('enter-back'));
      });
    });
  });

  /**
   * Utils
   */

  function navigate(path) {
    GaiaPages.prototype.getUrl.returns(path);
    window.dispatchEvent(new Event('hashchange'));
  }
});
