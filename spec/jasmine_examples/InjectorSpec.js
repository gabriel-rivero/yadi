'use strict';

describe("Injector", () => {
  it("should be able to inject to an object", () => {
    let a  = () => 'hello';
    let di = require('../../index.js');
    di.add(a, 'a');
    let b = {
      'dependencies': 'a'
    };
    di.inject(b);
    expect(b.a()).toEqual('hello');
  });

  it("should remember a previous add (singleton)", () => {
    let di = require('../../index.js');
    let c = {
      'dependencies': 'a'
    };
    di.inject(c);
    expect(c.a()).toEqual('hello');
  });

  it("should handle an array of injections", () => {
    let di = require('../../index.js');
    let b = () => 'bye';
    di.add(b, 'b');
    let c = {
      'dependencies': ['a', 'b']
    };
    di.inject(c);
    expect(c.a()).toEqual('hello');
    expect(c.b()).toEqual('bye');
  });
});
