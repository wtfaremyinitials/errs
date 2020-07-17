# errs ![CI](https://github.com/wtfaremyinitials/errs/workflows/CI/badge.svg)

Deno fork of a simple error creation and passing utilities focused on:

* [Creating Errors](#creating-errors)
* [Reusing Error Types](#reusing-types)
* [Merging with Existing Errors](#merging-errors)

<a name="creating-errors" />
## Creating Errors

You should know by now that [a String is not an Error][0]. Unfortunately the `Error` constructor in Javascript isn't all that convenient either. How often do you find yourself in this situation?

``` js
  let err = new Error('This is an error. There are many like it.');
  err.someProperty = 'more syntax';
  err.someOtherProperty = 'it wont stop.';
  err.notEven = 'for the mayor';

  throw err;
```

Rest your fingers, `errs` is here to help. The following is equivalent to the above:

``` js
  let errs = require('errs');

  throw errs.create({
    message: 'This is an error. There are many like it.',
    someProperty: 'more syntax',
    someOtherProperty: 'it wont stop.',
    notEven: 'for the mayor'
  });
```

<a name="reusing-types" />
## Reusing Custom Error Types

`errs` also exposes an [inversion of control][1] interface for easily reusing custom error types across your application. Custom Error Types registered with `errs` will transparently invoke `Error` constructor and `Error.captureStackTrace` to attach transparent stack traces:

``` js
  /*
   * file-a.js: Create and register your error type.
   *
   */

  import * as errs from 'https://raw.githubusercontent.com/wtfaremyinitials/errs/master/errs.js'

  function MyError() {
    this.message = 'This is my error; I made it myself. It has a transparent stack trace.';
  }

  //
  // Alternatively `MyError.prototype.__proto__ = Error;`
  //
  util.inherits(MyError, Error);

  //
  // Register the error type
  //
  errs.register('myerror', MyError);



  /*
   * file-b.js: Use your error type.
   *
   */

  import * as errs from 'https://raw.githubusercontent.com/wtfaremyinitials/errs/master/errs.js'

  console.log(
    errs.create('myerror')
      .stack
      .split('\n')
  );
```

The output from the two files above is shown below. Notice how it contains no references to `errs.js`:

```
[ 'MyError: This is my error; I made it myself. It has a transparent stack trace.',
  '    at Object.<anonymous> (/file-b.js:19:8)',
  '    at Module._compile (module.js:441:26)',
  '    at Object..js (module.js:459:10)',
  '    at Module.load (module.js:348:31)',
  '    at Function._load (module.js:308:12)',
  '    at Array.0 (module.js:479:10)',
  '    at EventEmitter._tickCallback (node.js:192:40)' ]
```

<a name="merging-errors" />
## Merging with Existing Errors

When working with errors you catch or are returned in a callback you can extend those errors with properties by using the `errs.merge` method. This will also create a human readable error message and stack-trace:

``` js
process.on('uncaughtException', function(err) {
  console.log(errs.merge(err, {namespace: 'uncaughtException'}));
});

var file = fs.createReadStream('FileDoesNotExist.here');
```

``` js
{ [Error: Unspecified error]
  name: 'Error',
  namespace: 'uncaughtException',
  errno: 34,
  code: 'ENOENT',
  path: 'FileDoesNotExist.here',
  description: 'ENOENT, no such file or directory \'FileDoesNotExist.here\'',
  stacktrace: [ 'Error: ENOENT, no such file or directory \'FileDoesNotExist.here\'' ] }
```

## Methods
The `errs` modules exposes some simple utility methods:

* `.create(type, opts)`: Creates a new error instance for with the specified `type` and `opts`. If the `type` is not registered then a new `Error` instance will be created.
* `.register(type, proto)`: Registers the specified `proto` to `type` for future calls to `errors.create(type, opts)`.
* `.unregister(type)`: Unregisters the specified `type` for future calls to `errors.create(type, opts)`.
* `.handle(err, callback)`: Attempts to instantiate the given `error`. If the `error` is already a properly formed `error` object (with a `stack` property) it will not be modified.
* `.merge(err, type, opts)`: Merges an existing error with a new error instance for with the specified `type` and `opts`.

#### Fork Author: [Will Franzen](http://github.com/wtfaremyinitials)
#### Original Author: [Charlie Robbins](http://github.com/indexzero)
#### Contributors: [Nuno Job](http://github.com/dscape)
#### License: MIT

[0]: http://www.devthought.com/2011/12/22/a-string-is-not-an-error/
[1]: http://martinfowler.com/articles/injection.html
[2]: https://vowsjs.org
[3]: https://npmjs.org
