'use strict';

const assert = require('assert');
const path   = require('path');
const vows   = require('vows');

const injectorPath = path.join(path.dirname(__dirname),'index');

// Create a Test Suite
vows.describe('Injector tests: ').addBatch({
  'direct injections': {
    // create the injector
    topic: () => {
      let injector = require(injectorPath);
      injector.outputMessages = false;
      return injector;
    },

    'inject to an object': injector => {
      let a = () => 'hello';
      injector.add(a, 'a');

      let b = {
        'dependencies': 'a'
      };
      injector.inject(b);
      assert.equal(b.a(), 'hello');
    },

    'remember a previous function added': injector => {
      let b = {
        'dependencies': 'a'
      };
      injector.inject(b);
      assert.equal(b.a(), 'hello');
    },

    'handle array of injections': injector => {
      let b = () => 'bye';
      injector.add(b, 'b');

      let d = {
        'dependencies': ['a', 'b', 'c']
      };
      injector.inject(d);
      assert.equal(d.a(), 'hello');
      assert.equal(d.b(), 'bye');
      assert.isUndefined(d.c);
    },

    'handle named injections': injector => {
      let c = {
        'dependencies': {
          'a': 'functionA',
          'b': 'functionB'
        }
      };
      injector.inject(c);
      assert.equal(c.functionA(), 'hello');
      assert.equal(c.functionB(), 'bye');
    },

    'inject an anonymus object into another': injector => {
      injector.add({run: () => 'running'}, 'a');
      let b = {'dependencies': 'a'};

      injector.inject(b);

      assert.equal(b.a.run(), 'running');
    },

    'inject an object and function into several objects': injector => {
      let b = {'dependencies': ['a', 'b']};
      let c = {'dependencies': ['b']};

      injector.inject([b, c]);
      assert.equal(b.a.run(), 'running');
      assert.equal(b.b(), 'bye');
      assert.equal(c.b(), 'bye');
    },

    'inject an object into a class': injector => {
      class Tester {
        static get dependencies() {
          return 'a';
        }
        static sRun() {
          return this.a.run();
        }
        run() {
          return Tester.a.run();
        }
      }

      injector.inject(Tester);

      assert.equal(Tester.a.run(), 'running');
      assert.equal(Tester.sRun(), 'running');
      let tester = new Tester();
      assert.equal(tester.run(), 'running');
    },

    'require on add': injector => {
      injector.requireAndAdd(path.join(__dirname, 'subjects', '1.js'));

      let subject = {
        dependencies: '1'
      };

      injector.inject(subject);

      assert.equal(subject['1'](), 'success');
    },

    'require and modify on add': injector => {
      injector.requireAndAdd(path.join(__dirname, 'subjects', '2.js'), 'named', module => module('chimichangas'));

      let subject = {
        dependencies: 'named'
      };

      injector.inject(subject);

      assert.equal(subject.named(), 'the string passed was chimichangas');
    }
  },
  'file injection': {
    topic: () => {
      let injector = require(injectorPath);
      injector.outputMessages = false;
      return injector;
    },
    'inject into a file': {
      topic: function (injector) {
        injector.inject(path.join(__dirname, 'patients', '0.js'))
                .then(() => this.callback());
      },
      'file should have received the injection': () => {
        let file0 = require(path.join(__dirname, 'patients', '0.js'));
        assert.equal(file0.a.run(), 'running');
      }
    }
  },
  'directory injection': {
    topic: () => {
      let injector = require(injectorPath);
      injector.outputMessages = false;
      return injector;
    },
    'inject into a directory': {
      topic: function (injector) {
        injector
        .inject(path.join(__dirname, 'patients'))
        .then(() => this.callback());
      },
      'file should have received the injection': () => {
        let file0 = require(path.join(__dirname, 'patients', '0.js'));
        assert.equal(file0.a.run(), 'running');

        let Class0 = require(path.join(__dirname, 'patients', 'class.js'));
        assert.equal(Class0.a.run(), 'running');
        assert.equal(Class0.b(), 'bye');
      }
    }
  }
}).run(); // Run it
