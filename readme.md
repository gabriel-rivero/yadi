# YADI (Yet Another Dependency injector)
[![NPM Version][npm-image]][npm-url]
[![Build][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[![NPM][npm-image]][npm-url]

## Usage
require the file
```
const di = require('yadi');
```
add some stuff to the container
```
let something = () => 'hello potato';
di.add(something, 'custom name');
```
adds the class or function to the container, the optional custom name is recommended to manage the dependencies.

```
var obj = {
  'dependencies': 'custom name'
};
di.inject(obj)
```
injects the object with whatever was in the custom name, warns if the name don't exist but continues anyway
```
class Potato {
  get dependencies() {
    return ['custom name 1', 'custom name 2']
  }
}
di.inject(Potato);
```
injects the class potato with two dependencies, the dependencies are at the definition of the class, meaning they are accessible using static methods
```
var obj = {
  'dependencies': {
    'custom name': 'potato'
  }
}
di.inject(obj)
```
injects the object with the object in custom name, it's available in the object as potato
```
di.inject([obj1, obj2]);
```
injects several objects at the same time
```
di.inject('/some/directory/path');

let potato = require('/some/directory/path/potato');
console.log(potato['custom name']());
```
```
-> 'hello potato'
```
injects all the files in the path with whatever they need, also a single file can be passed
## TODO
* Improve this file

[npm-image]: https://img.shields.io/npm/v/yadi.svg
[npm-url]: https://npmjs.org/package/yadi
[travis-image]: https://img.shields.io/travis/gabriel-rivero/yadi/develop.svg
[travis-url]: https://travis-ci.org/gabriel-rivero/yadi
[downloads-image]: https://img.shields.io/npm/dm/mysql2.svg
[downloads-url]: https://npmjs.org/package/mysql2
[coveralls-image]: https://coveralls.io/repos/github/gabriel-rivero/yadi/badge.svg
[coveralls-url]: https://coveralls.io/github/gabriel-rivero/yadi?branch=develop
[npm-image]: https://nodei.co/npm/yadi.png?downloads=true
[npm-url]: https://nodei.co/npm/yadi/
