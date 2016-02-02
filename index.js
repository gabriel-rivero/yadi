'use strict';

const _    = require('lodash');
const fs   = require('fs');
const path = require('path');

const singleton     = Symbol();
const singletonLock = Symbol();
const injectables   = Symbol();

const throwError = error => {
  throw error;
};

class InjectorContainer {
  /**
   * constructor locked to allow only one instance of the singleton
   * @param lock
   */
  constructor(lock) {
    (lock != singletonLock) && throwError("Cannot construct singleton");
    this[injectables] = {};
  }

  /**
   * Gets the instance of the singleton
   * @returns {*}
   */
  static get instance() {
    this[singleton] = this[singleton] || new InjectorContainer(singletonLock);
    return this[singleton];
  }

  /**
   * adds an object to the container
   * @param {object|function} object
   * @param {string} name optional
   */
  add(object, name) {
    name = name || object.constructor.name;
    this[injectables][name] = object;
  }

  /**
   * injects dependencies to whatever arrives
   * @param something
   */
  inject(something) {
    let type = typeof something;
    type === 'object' && _.isArray(something) && (type = 'array');
    this[type + 'Injector'] ? this[type + 'Injector'](something)
                            : throwError(`Injector type '${type}' not defined`);
  }

  /**
   * injects to an array of somethings
   * @param somethings
   */
  arrayInjector(somethings) {
    _.forEach(somethings, something => this.inject(something));
  }

  /**
   * injects to an object, actually the code for function works just fine
   * @param something
   */
  objectInjector(something) {
    this.functionInjector(something);
  }

  /**
   * injects the dependencies into the files of a directory or a single file
   */
  stringInjector(something) {
    fs.exists(something, (exists) =>
      !exists ? throwError(`Path '${something}' don't exists`) : (
        fs.stat(something, (err, stats) =>
          err ? throwError(`Error reading '${something}'`) : (
            stats.isDirectory() ? this.directoryInjector(something)
                                : this.fileInjector(something)
          )
        )
      )
    )
  }

  /**
   * injects into all the files of a directory
   */
  directoryInjector(directoryPath) {
    fs.readdir(directoryPath, (err, files) =>
      err ? throwError(`Error listing files on '${directoryPath}'`)
          : files.forEach(file =>
              this.fileInjector(path.join(directoryPath, file))
            )
    )
  }

  /**
   * injects into the file
   */
  fileInjector(filePath) {
    let temp = require(filePath);
    this.inject(temp);
  }

  /**
   * injector for class definitions
   * @param {function} something
   */
  functionInjector(something) {
    let dependencies = this.getDependencies(something);
    _.forEach(dependencies, (value, index) => {
      (this[injectables][index]) ? something[value] = this[injectables][index]
                                 : console.warn(`Injectable '${index}' is not defined`);
    });
  }

  /**
   * gets the dependencies to be injected
   * @param dependencies
   * @returns {object}
   */
  getDependencies(something) {
    let dependencies = something['dependencies'];
    let type         = typeof dependencies;
    type === 'object' && _.isArray(dependencies) && (type = 'array');
    // treatments to use to handle the dependencies
    let treatments = {
      'object': dependencies => dependencies,
      'string': dependency => {
        let object = {};
        object[dependency] = dependency;
        return object;
      },
      'array': dependencies => {
        let object = {};
        _.forEach(dependencies, value => object[value] = value);
        return object;
      },
      'undefined': () => {
        console.warn(`No dependencies found, ignoring`);
        return {};
      }
    };
    return treatments[type] ? treatments[type](dependencies)
                            : throwError(`Treatment for dependencies '${type}' not defined`);
  }
}

module.exports = InjectorContainer.instance;
