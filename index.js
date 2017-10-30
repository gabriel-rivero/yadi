'use strict';

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
    this.outputMessages = true;
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
   * requires a file, gives the name if specified, the treater is a function to update the requirement
   * @param  {string} filename
   * @param  {string} name
   * @param  {function} treater
   * @return {Promise}
   */
  requireAndAdd(filename, name, treater) {
    treater === undefined && typeof name === 'function' && (treater = name) && (name = undefined);
    !treater && (treater = obj => obj);
    name    = name    || filename.split('/').pop().split('.').shift();
    let obj = require(filename);
    obj     = treater(obj);
    return this.add(obj, name);
  }

  /**
   * adds an object to the container
   * @param {object|function} object
   * @param {string} name optional
   * @return {Promise}
   */
  add(object, name) {
    name = name || object.constructor.name;
    this[injectables][name] = object;
    return Promise.resolve(object);
  }

  /**
   * injects dependencies to whatever arrives
   * @param something
   */
  inject(something) {
    let type = this.getType(something);
    return this[type + 'Injector'] ? this[type + 'Injector'](something)
                                   : throwError(`Injector type '${type}' not defined`);
  }

  /**
   * gets the type of something
   * @param something
   */
  getType(something) {
    let type = typeof something;
    type === 'object' && Array.isArray(something) && (type = 'array');
    return type;
  }

  /**
   * injects to an array of somethings
   * @param somethings
   */
  arrayInjector(somethings) {
    return Promise.all(somethings.map(something => this.inject(something)));
  }

  /**
   * injects to an object, actually the code for function works just fine
   * @param something
   */
  objectInjector(something) {
    return this.functionInjector(something);
  }

  /**
   * injects the dependencies into the files of a directory or a single file
   */
  stringInjector(something) {
    return new Promise(resolve => {
      this.doesPathExist(something)
      .then(() => this.getPathInformation(something))
      .then(stats => stats.isDirectory() ? this.directoryInjector(something)
                                         : this.fileInjector(something))
      .catch(() => throwError(`Path '${something}' does not exist or has an access error`));
    });
  }

  /**
   * checks if the path exists
   * @param  {string}
   * @return {Promise} resolves when exists, rejects if not
   */
  doesPathExist(path) {
    return new Promise((resolve, reject) =>
      fs.exists(path, exists =>
        exists ? resolve() : reject()));
  }

  /**
   * gets information regarding the path and what it represents
   * @param  {string} path
   * @return {Promise} rejects on error
   */
  getPathInformation(path) {
    return new Promise((resolve, reject) =>
      fs.stat(path, (err, stats) =>
        !err ? resolve(stats) : reject()));
  }

  /**
   * injects into all the files of a directory
   */
  directoryInjector(directoryPath) {
    return new Promise((resolve, reject) => {
      this.getFilesInDirectory(directoryPath)
      .then(files => Promise.all(files.map(file => this.fileInjector(path.join(directoryPath, file)))))
      .catch(() => throwError(`Error listing files on '${directoryPath}'`));
    });
  }

  /**
   * gets the files in a directory
   * @param  {string} path
   * @return {array}
   */
  getFilesInDirectory(path) {
    return new Promise((resolve, reject) => fs.readdir(path, (err, files) => err ? reject(err) : resolve(files)));
  }

  /**
   * injects into the file
   */
  fileInjector(filePath) {
    let temp;
    try {
      temp = require(filePath);
    } catch (err) {
      this.outputMessages && console.error('error loading file', err);
      return Promise.reject(err);
    }
    return this.inject(temp);
  }

  /**
   * injector for class definitions
   * @param {function} something
   */
  functionInjector(something) {
    let dependencies = this.getDependencies(something);
    return Promise.all(Object.keys(dependencies).map(name => {
      if (this[injectables][name]) {
        something[dependencies[name]] = this[injectables][name];
      } else {
        this.outputMessages && console.warn(`Injectable '${name}' is not defined`);
      }
      // always resolve despite the possible warning
      return Promise.resolve();
    }));
  }

  /**
   * gets the dependencies to be injected
   * @param dependencies
   * @returns {object}
   */
  getDependencies(something) {
    let dependencies = something.dependencies;
    let type         = this.getType(dependencies);
    // treatments to use to handle the dependencies
    let treatments = {
      'object': dependencies => dependencies,
      'string': dependency => {
        let object = {};
        object[dependency] = dependency;
        return object;
      },
      'array': dependencies => dependencies.reduce((obj, name) => (obj[name] = name) && obj, {}),
      'undefined': () => {
        this.outputMessages && console.warn(`No dependencies found, ignoring`);
        return {};
      }
    };
    return treatments[type] ? treatments[type](dependencies)
                            : throwError(`Treatment for dependencies '${type}' not defined`);
  }
}

module.exports = InjectorContainer.instance;
