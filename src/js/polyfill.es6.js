// From
// https://raw.githubusercontent.com/inexorabletash/polyfill/a6bc6ced78160c994f76a909b6ff6bbbab3d43de/es6.js
// Required for ethereumjs-utils.js when run in phantomjs-2.1.1
// but is not required in any modern browsers.
// For more information, see
// https://www.bountysource.com/issues/38485709-error-rendering-plot-with-phantomjs

//----------------------------------------------------------------------
//
// ECMAScript 2015 Polyfills
//
//----------------------------------------------------------------------

(function (global) {
  "use strict";

  // Set this to always override native implementations, for testing
  // the polyfill in browsers with partial/full ES2015 support.
  var OVERRIDE_NATIVE_FOR_TESTING = false;

  var undefined = (void 0); // Paranoia

  // Helpers

  function strict(o) {
    return o === global ? undefined : o;
  }

  function hook(o, p, f) {
    var op = o[p];
    console.assert(typeof op === 'function', 'Hooking a non-function');
    o[p] = function() {
      var o = strict(this);
      var r = f.apply(o, arguments);
      return r !== undefined ? r : op.apply(o, arguments);
    };
  }

  function isSymbol(s) {
    return (typeof s === 'symbol') || ('Symbol' in global && s instanceof global.Symbol);
  }

  function getPropertyDescriptor(target, name) {
    var desc = Object.getOwnPropertyDescriptor(target, name);
    var proto = Object.getPrototypeOf(target);
    while (!desc && proto) {
      desc = Object.getOwnPropertyDescriptor(proto, name);
      proto = Object.getPrototypeOf(proto);
    }
    return desc;
  }

  var enqueue = (function(nativePromise, nativeSetImmediate) {
    if (nativePromise)
      return function(job) { nativePromise.resolve().then(function() { job(); }); };
    if (nativeSetImmediate)
      return function(job) { nativeSetImmediate(job); };
    return function(job) { setTimeout(job, 0); };
  }(global['Promise'], global['setImmediate']));

  function define(o, p, v, override) {
    if (p in o && !override && !OVERRIDE_NATIVE_FOR_TESTING)
      return;

    if (typeof v === 'function') {
      // Sanity check that functions are appropriately named (where possible)
      console.assert(isSymbol(p) || !('name' in v) || v.name === p || v.name === p + '_', 'Expected function name "' + p.toString() + '", was "' + v.name + '"');
      Object.defineProperty(o, p, {
        value: v,
        configurable: true,
        enumerable: false,
        writable: true
      });
    } else {
      Object.defineProperty(o, p, {
        value: v,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
  }

  function set_internal(o, p, v) {
    Object.defineProperty(o, p, {
      value: v,
      configurable: false,
      enumerable: false,
      writable: true
    });
  }

  // Snapshot intrinsic functions
  var $isNaN = global.isNaN,
      $parseInt = global.parseInt,
      $parseFloat = global.parseFloat;

  var E = Math.E,
      LOG10E = Math.LOG10E,
      LOG2E = Math.LOG2E,
      abs = Math.abs,
      ceil = Math.ceil,
      exp = Math.exp,
      floor = Math.floor,
      log = Math.log,
      max = Math.max,
      min = Math.min,
      pow = Math.pow,
      random = Math.random,
      sqrt = Math.sqrt;

  var orig_match = String.prototype.match,
      orig_replace = String.prototype.replace,
      orig_search = String.prototype.search,
      orig_split = String.prototype.split;

  // These are used for implementing the polyfills, but not exported.

  // Inspired by https://gist.github.com/1638059
  /** @constructor */
  function EphemeronTable() {
    var secretKey = ObjectCreate(null);

    function conceal(o) {
      var oValueOf = o.valueOf, secrets = ObjectCreate(null);
      Object.defineProperty(o, 'valueOf', {
          value: (function(secretKey) {
            return function (k) {
              return (k === secretKey) ? secrets : oValueOf.apply(o, arguments);
            };
          }(secretKey)),
        configurable: true,
        writeable: true,
        enumerable: false
        });
      return secrets;
    }

    function reveal(o) {
      var v = typeof o.valueOf === 'function' && o.valueOf(secretKey);
      return v === o ? null : v;
    }

    return {
      clear: function() {
        secretKey = ObjectCreate(null);
      },
      remove: function(key) {
        var secrets = reveal(key);
        if (secrets && HasOwnProperty(secrets, 'value')) {
          delete secrets.value;
          return true;
        }
        return false;
      },
      get: function(key, defaultValue) {
        var secrets = reveal(key);
        return (secrets && HasOwnProperty(secrets, 'value')) ? secrets.value : defaultValue;
      },
      has: function(key) {
        var secrets = reveal(key);
        return Boolean(secrets && HasOwnProperty(secrets, 'value'));
      },
      set: function(key, value) {
        var secrets = reveal(key) || conceal(key);
        secrets.value = value;
      }
    };
  }

  var empty = Object.create(null);

  //----------------------------------------------------------------------
  //
  // ECMAScript 2015
  // http://www.ecma-international.org/ecma-262/6.0/
  //
  //----------------------------------------------------------------------

  // ---------------------------------------
  // 19.4 Symbol Objects
  // ---------------------------------------

  // NOTE: Symbols are defined here - out of spec order - since we need the
  // properties and prototype to be populated for other polyfills.

  // NOTE: Not secure, nor is obj[$$symbol] hidden from Object.keys()

  var symbolForKey;
  (function() {
    var secret = Object.create(null);
    var symbolMap = {};
    symbolForKey = function(k) {
      return symbolMap[k];
    };

    var GlobalSymbolRegistry = [];

    function unique(bits) {
      return Array(bits + 1).join('x').replace(/x/g, function() {
        return random() < 0.5 ? '\u200C' : '\u200D'; // JWNJ / ZWJ
      });
    }

    // 19.4.1 The Symbol Constructor
    // 19.4.1.1 Symbol ( description=undefined )
    function Symbol(description) {
      if (!(this instanceof Symbol)) return new Symbol(description, secret);
      if (this instanceof Symbol && arguments[1] !== secret) throw TypeError();

      var descString = description === undefined ? undefined : String(description);

      set_internal(this, '[[SymbolData]]', unique(128));
      set_internal(this, '[[Description]]', descString);

      symbolMap[this] = this;
      return this;
    }

    if (!('Symbol' in global) || OVERRIDE_NATIVE_FOR_TESTING)
      global.Symbol = Symbol;

    // 19.4.2 Properties of the Symbol Constructor

    // 19.4.2.1 Symbol.for (key)
    define(Symbol, 'for', function for_(key) {
      var stringKey = String(key);
      for (var i = 0; i < GlobalSymbolRegistry.length; ++i) {
        var e = GlobalSymbolRegistry[i];
        if (SameValue(e['[[key]]'], stringKey)) return e['[[symbol]]'];
      }
      var newSymbol = Symbol(key);
      GlobalSymbolRegistry.push({'[[key]]': stringKey, '[[symbol]]': newSymbol});
      return newSymbol;
    });

    // 19.4.2.2 Symbol.hasInstance
    // 19.4.2.3 Symbol.isConcatSpreadable

    // 19.4.2.4 Symbol.iterator
    define(global.Symbol, 'iterator', global.Symbol('Symbol.iterator'));

    // 19.4.2.5 Symbol.keyFor (sym)
    define(Symbol, 'keyFor', function keyFor(sym) {
      if (!(sym instanceof Symbol)) throw TypeError();
      for (var i = 0; i < GlobalSymbolRegistry.length; ++i) {
        var e = GlobalSymbolRegistry[i];
        if (SameValue(e['[[symbol]]'], sym)) return e['[[key]]'];
      }
      return undefined;
    });

    // 19.4.2.6 Symbol.match
    define(global.Symbol, 'match', global.Symbol('Symbol.match'));

    // 19.4.2.7 Symbol.prototype

    // 19.4.2.8 Symbol.replace
    define(global.Symbol, 'replace', global.Symbol('Symbol.replace'));

    // 19.4.2.9 Symbol.search
    define(global.Symbol, 'search', global.Symbol('Symbol.search'));

    // 19.4.2.10 Symbol.species

    // 19.4.2.11 Symbol.search
    define(global.Symbol, 'split', global.Symbol('Symbol.split'));

    // 19.4.2.12 Symbol.toPrimitive

    // 19.4.2.13 Symbol.toStringTag
    define(global.Symbol, 'toStringTag', global.Symbol('Symbol.toStringTag'));

    // 19.4.2.14 Symbol.unscopables

    // 19.4.3 Properties of the Symbol Prototype Object
    // 19.4.3.1 Symbol.prototype.constructor

    // 19.4.3.2 Symbol.prototype.toString ( )
    Object.defineProperty(Symbol.prototype, 'toString', {
      value: function toString() {
        var s = strict(this);
        var desc = s['[[Description]]'];
        return 'Symbol(' + (desc === undefined ? '' : desc) + s['[[SymbolData]]'] + ')';
      },
      configurable: true, writeable: true, enumerable: false });

    // 19.4.3.3 Symbol.prototype.valueOf ( )
    Object.defineProperty(Symbol.prototype, 'valueOf', {
      value: function valueOf() {
        // To prevent automatic string conversion:
        throw TypeError();

        // Spec has approximately the following:
        //var s = strict(this);
        //if (Type(s) === 'symbol') return s;
        //if (Type(s) !== 'object') throw TypeError();
        //if (!('[[SymbolData]]' in s)) throw TypeError();
        //return s['[[SymbolData]]'];
      },
      configurable: true, writeable: true, enumerable: false });

    // 19.4.3.4 Symbol.prototype [ @@toStringTag ]
    // (Done later to polyfill partial implementations)

    // 19.4.4 Properties of Symbol Instances
  }());

  console.assert(typeof global.Symbol() === 'symbol' || symbolForKey(String(global.Symbol('x'))));

  // Defined here so that other prototypes can reference it
  // 25.1.2 The %IteratorPrototype% Object
  var $IteratorPrototype$ = {};

  //----------------------------------------
  // 6 ECMAScript Data Types and Values
  //----------------------------------------

  // 6.1 ECMAScript Language Types

  // "Type(x)" is used as shorthand for "the type of x"...
  function Type(v) {
    switch (typeof v) {
    case 'undefined': return 'undefined';
    case 'boolean': return 'boolean';
    case 'number': return 'number';
    case 'string': return 'string';
    case 'symbol': return 'symbol';
    default:
      if (v === null) return 'null';
      if (v instanceof global.Symbol) return 'symbol';
      return 'object';
    }
  }

  // 6.1.5.1 Well-Known Symbols
  var $$iterator = global.Symbol.iterator,
      $$match = global.Symbol.match,
      $$replace = global.Symbol.replace,
      $$search = global.Symbol.search,
      $$split = global.Symbol.split,
      $$toStringTag = global.Symbol.toStringTag;

  //----------------------------------------
  // 7 Abstract Operations
  //----------------------------------------

  //----------------------------------------
  // 7.1 Type Conversion
  //----------------------------------------

  // 7.1.1 ToPrimitive ( input [, PreferredType] )
  // just use valueOf()

  // 7.1.2 ToBoolean ( argument )
  // just use Boolean()

  // 7.1.3 ToNumber ( argument )
  // just use Number()

  // 7.1.4 ToInteger ( argument )
  function ToInteger(n) {
    n = Number(n);
    if ($isNaN(n)) return 0;
    if (n === 0 || n === Infinity || n === -Infinity) return n;
    return ((n < 0) ? -1 : 1) * floor(abs(n));
  }

  // 7.1.5 ToInt32 ( argument )
  function ToInt32(v) { return v >> 0; }

  // 7.1.6 ToUint32 ( argument )
  function ToUint32(v) { return v >>> 0; }

  // 7.1.7 ToInt16 ( argument )
  function ToInt16(v) { return (v << 16) >> 16; }

  // 7.1.8 ToUint16 ( argument )
  function ToUint16(v) { return v & 0xFFFF; }

  // 7.1.9 ToInt8 ( argument )
  function ToInt8(v) { return (v << 24) >> 24; }

  // 7.1.10 ToUint8 ( argument )
  function ToUint8(v) { return v & 0xFF; }

  // 7.1.11 ToUint8Clamp ( argument )
  function ToUint8Clamp(argument) {
    var number = Number(argument);
    if ($isNaN(number)) return 0;
    if (number <= 0) return 0;
    if (number >= 255) return 255;
    var f = floor(number);
    if ((f + 0.5) < number) return f + 1;
    if (number < (f + 0.5)) return f;
    if (f % 2) return f + 1;
    return f;
  }

  // 7.1.12 ToString ( argument )
  // just use String()

  // 7.1.13 ToObject ( argument )
  function ToObject(v) {
    if (v === null || v === undefined) throw TypeError();
    return Object(v);
  }

  // 7.1.14 ToPropertyKey ( argument )
  function ToPropertyKey(v) {
    return String(v);
  }

  // 7.1.15 ToLength ( argument )
  function ToLength(v) {
    var len = ToInteger(v);
    if (len <= 0) return 0;
    if (len === Infinity) return 0x20000000000000 - 1; // 2^53-1
    return min(len, 0x20000000000000 - 1); // 2^53-1
  }

  // 7.1.16 CanonicalNumericIndexString ( argument )

  //----------------------------------------
  // 7.2 Testing and Comparison Operations
  //----------------------------------------

  // 7.2.1 RequireObjectCoercible ( argument )
  // 7.2.2 IsArray ( argument )

  // 7.2.3 IsCallable ( argument )
  function IsCallable(o) { return typeof o === 'function'; }

  // 7.2.4 IsConstructor ( argument )
  function IsConstructor(o) {
    // Hacks for Safari 7 TypedArray XXXConstructor objects
    if (/Constructor/.test(Object.prototype.toString.call(o))) return true;
    if (/Function/.test(Object.prototype.toString.call(o))) return true;
    // TODO: Can this be improved on?
    return typeof o === 'function';
  }

  // 7.2.5 IsExtensible (O)
  // 7.2.6 IsInteger ( argument )

  // 7.2.7 IsPropertyKey ( argument )
  function IsPropertyKey(argument) {
    if (Type(argument) === 'string') return true;
    if (Type(argument) === 'symbol') return true;
    return false;
  }

  // 7.2.8 IsRegExp ( argument )
  // 7.2.5 IsConstructor ( argument )

  // 7.2.9 SameValue(x, y)
  function SameValue(x, y) {
    if (typeof x !== typeof y) return false;
    switch (typeof x) {
    case 'undefined':
      return true;
    case 'number':
      if (x !== x && y !== y) return true;
      if (x === 0 && y === 0) return 1/x === 1/y;
      return x === y;
    case 'boolean':
    case 'string':
    case 'object':
    default:
      return x === y;
    }
  }

  // 7.2.10 SameValueZero(x, y)
  function SameValueZero(x, y) {
    if (typeof x !== typeof y) return false;
    switch (typeof x) {
    case 'undefined':
      return true;
    case 'number':
      if (x !== x && y !== y) return true;
      return x === y;
    case 'boolean':
    case 'string':
    case 'object':
    default:
      return x === y;
    }
  }

  //----------------------------------------
  // 7.3 Operations on Objects
  //----------------------------------------

  // 7.3.1 Get (O, P)
  // - just use o.p or o[p]

  // 7.3.2 GetV (V, P)
  function GetV(v, p) {
    var o = ToObject(v);
    return o[p];
  }

  // 7.3.3 Set (O, P, V, Throw)
  // - just use o.p = v or o[p] = v




  // 7.3.9 GetMethod (O, P)
  function GetMethod(o, p) {
    var func = GetV(o, p);
    if (func === undefined || func === null) return undefined;
    if (!IsCallable(func)) throw TypeError();
    return func;
  }

  // 7.3.10 HasProperty (O, P)
  function HasProperty(o, p) {
    while (o) {
      if (Object.prototype.hasOwnProperty.call(o, p)) return true;
      if (Type(o) !== 'object') return false;
      o = Object.getPrototypeOf(o);
    }
    return false;
  }

  // 7.3.11 HasOwnProperty (O, P)
  function HasOwnProperty(o, p) {
    return Object.prototype.hasOwnProperty.call(o, p);
  }

  //----------------------------------------
  // 7.4 Operations on Iterator Objects
  //----------------------------------------

  // 7.4.1 GetIterator ( obj, method )
  function GetIterator(obj, method) {
    if (arguments.length < 2)
      method = GetMethod(obj, $$iterator);
    var iterator = method.call(obj);
    if (Type(iterator) !== 'object') throw TypeError();
    return iterator;
  }

  // 7.4.2 IteratorNext ( iterator, value )
  function IteratorNext(iterator, value) {
    if (arguments.length < 2)
      var result = iterator.next();
    else
      result = iterator.next(value);
    if (Type(result) !== 'object') throw TypeError();
    return result;
  }

  // 7.4.3 IteratorComplete ( iterResult )
  function IteratorComplete(iterResult) {
    console.assert(Type(iterResult) === 'object');
    return Boolean(iterResult.done);
  }

  // 7.4.4 IteratorValue ( iterResult )
  function IteratorValue(iterResult) {
    console.assert(Type(iterResult) === 'object');
    return iterResult.value;
  }

  // 7.4.5 IteratorStep ( iterator )
  function IteratorStep( iterator, value ) {
    var result = IteratorNext(iterator, value);
    var done = result['done'];
    if (Boolean(done) === true) return false;
    return result;
  }

  // 7.4.6 IteratorClose( iterator, completion )
  function IteratorClose( iterator, completion ) {
    console.assert(Type(iterator) === 'object');
    var _return = GetMethod(iterator, 'return');
    if (_return === undefined) return completion;
    try {
      var innerResult = _return[iterator]();
    } catch (result) {
      // TODO: If completion.[[type]] is throw, return completion
      return result;
    }
    if (Type(innerResult) !== 'object') throw TypeError();
    return completion;
  }

  // 7.4.7 CreateIterResultObject (value, done)
  function CreateIterResultObject(value, done) {
    console.assert(Type(done) === 'boolean');
    var obj = {};
    obj["value"] = value;
    obj["done"] = done;
    return obj;
  }

  // 7.4.8 CreateListIterator (list)
  // 7.4.8.1 ListIterator next( )
  // 7.4.9 CreateCompoundIterator ( iterator1, iterator2 )
  // 7.4.9.1 CompoundIterator next( )

  //----------------------------------------
  // 8 Executable Code and Execution Contexts
  //----------------------------------------

  //----------------------------------------
  // 8.4 Jobs and Job Queues
  //----------------------------------------

  // 8.4.1 EnqueueJob ( queueName, job, arguments)
  function EnqueueJob(queueName, job, args) {
    var fn = function() { job.apply(undefined, args); };
    enqueue(fn);
  }

  // 8.4.2 NextJob result
  function NextJob(result) {
    // no-op
  }

  //----------------------------------------
  // 9 Ordinary and Exotic Objects Behaviors
  //----------------------------------------

  // 9.1.11 [[Enumerate]] ()
  function Enumerate(obj) {
    var e = [];
    if (Object(obj) !== obj) return e;
    var visited = new Set;
    while (obj !== null) {
      Object.getOwnPropertyNames(obj).forEach(function(name) {
        if (!visited.has(name)) {
          var desc = Object.getOwnPropertyDescriptor(obj, name);
          if (desc) {
            visited.add(name);
            if (desc.enumerable) e.push(name);
          }
        }
      });
      obj = Object.getPrototypeOf(obj);
    }
    return e[$$iterator]();
  }

  // 9.1.12 [[OwnPropertyKeys]] ( )
  function OwnPropertyKeys(o) {
    return Object.getOwnPropertyNames(o);
  }

  // 9.1.13 ObjectCreate(proto, internalSlotsList)
  function ObjectCreate(proto, internalSlotsList) {
    return Object.create(proto, internalSlotsList);
  }

  // ---------------------------------------
  // 19 Fundamental Objects
  // ---------------------------------------

  // ---------------------------------------
  // 19.1 Object Objects
  // ---------------------------------------

  // 19.1.1 The Object Constructor
  // 19.1.1.1 Object ( [ value ] )
  // 19.1.2 Properties of the Object Constructor
  // 19.1.2.1 Object.assign ( target, ...sources )
  define(
    Object, 'assign',
    function assign(target, /*...*/sources) {
      var to = ToObject(target);
      if (arguments.length < 2) return to;

      var sourcesIndex = 1;
      while (sourcesIndex < arguments.length) {
        var nextSource = arguments[sourcesIndex++];
        if (nextSource === undefined || nextSource === null) {
          var keys = [];
        } else {
          var from = ToObject(nextSource);
          keys = OwnPropertyKeys(from);
        }
        for (var keysIndex = 0; keysIndex < keys.length; ++keysIndex) {
          var nextKey = keys[keysIndex];
          var desc = Object.getOwnPropertyDescriptor(from, nextKey);
          if (desc !== undefined && desc.enumerable) {
            var propValue = from[nextKey];
            to[nextKey] = propValue;
          }
        }
      }
      return to;
    });

  // 19.1.2.2 Object.create ( O [ , Properties ] )
  // 19.1.2.3 Object.defineProperties ( O, Properties )
  // 19.1.2.4 Object.defineProperty ( O, P, Attributes )
  // 19.1.2.5 Object.freeze ( O )
  // 19.1.2.6 Object.getOwnPropertyDescriptor ( O, P )

  (function() {
    var nativeSymbols = (typeof global.Symbol() === 'symbol'),
        $getOwnPropertyNames = Object.getOwnPropertyNames,
        $keys = Object.keys,
        $window_names = (typeof window === 'object' ? $getOwnPropertyNames(window) : []);

    function isStringKey(k) { return !symbolForKey(k); }

    // 19.1.2.7 Object.getOwnPropertyNames ( O )
    define(
      Object, 'getOwnPropertyNames',
      function getOwnPropertyNames(o) {
        if (Object.prototype.toString.call(o) === '[object Window]') {
          // Workaround for cross-realm calling by IE itself.
          // https://github.com/inexorabletash/polyfill/issues/96
          try {
            return $getOwnPropertyNames(o).filter(isStringKey);
          } catch (_) {
            return $window_names.slice();
          }
        }
        return $getOwnPropertyNames(o).filter(isStringKey);
      }, !nativeSymbols);

    // 19.1.2.8 Object.getOwnPropertySymbols ( O )
    define(
      Object, 'getOwnPropertySymbols',
      function getOwnPropertySymbols(o) {
        return $getOwnPropertyNames(o).filter(symbolForKey).map(symbolForKey);
      }, !nativeSymbols);

    // 19.1.2.14 Object.keys ( O )
    define(
      Object, 'keys',
      function keys(o) {
        return $keys(o).filter(isStringKey);
      }, !nativeSymbols);
  }());

  // 19.1.2.9 Object.getPrototypeOf ( O )
  // 19.1.2.10 Object.is ( value1, value2 )
  define(
    Object, 'is',
    function is(value1, value2) {
      return SameValue(value1, value2);
    });

  // 19.1.2.11 Object.isExtensible ( O )
  // 19.1.2.12 Object.isFrozen ( O )
  // 19.1.2.13 Object.isSealed ( O )

  // 19.1.2.14 Object.keys ( O )
  // see above

  // 19.1.2.15 Object.preventExtensions ( O )
  // 19.1.2.16 Object.prototype
  // 19.1.2.17 Object.seal ( O )

  // 19.1.2.18 Object.setPrototypeOf ( O, proto )
  define(
    Object, 'setPrototypeOf',
    function setPrototypeOf(o, proto) {
      if (Type(o) !== 'object') throw TypeError();
      if (Type(proto) !== 'object' && Type(proto) !== 'null') throw TypeError();
      o.__proto__ = proto;
      return o;
    }
  );

  // 19.1.3 Properties of the Object Prototype Object
  // 19.1.3.1 Object.prototype.constructor
  // 19.1.3.2 Object.prototype.hasOwnProperty ( V )
  // 19.1.3.3 Object.prototype.isPrototypeOf ( V )
  // 19.1.3.4 Object.prototype.propertyIsEnumerable ( V )
  // 19.1.3.5 Object.prototype.toLocaleString ( [ reserved1 [ , reserved2 ] ] )
  // 19.1.3.6 Object.prototype.toString ( )
  hook(Object.prototype, 'toString',
       function() {
         var o = strict(this);
         if (o === Object(o) && $$toStringTag in o) {
           return '[object ' + o[$$toStringTag] + ']';
         }
         return undefined;
       });

  // 19.1.3.7 Object.prototype.valueOf ( )
  // 19.1.4 Properties of Object Instances

  // ---------------------------------------
  // 19.2 Function Objects
  // ---------------------------------------

  // 19.2.1 The Function Constructor
  // 19.2.1.1 Function ( p1, p2, … , pn, body )
  // 19.2.2 Properties of the Function Constructor
  // 19.2.2.1 Function.length
  // 19.2.2.2 Function.prototype
  // 19.2.3 Properties of the Function Prototype Object
  // 19.2.3.1 Function.prototype.apply ( thisArg, argArray )
  // 19.2.3.2 Function.prototype.bind ( thisArg , ...args)
  // 19.2.3.3 Function.prototype.call (thisArg , ...args)
  // 19.2.3.4 Function.prototype.constructor
  // 19.2.3.5 Function.prototype.toString ( )
  // 19.2.3.6 Function.prototype[@@hasInstance] ( V )
  // 19.2.4 Function Instances
  // 19.2.4.1 length
  // 19.2.4.2 name
  // 19.2.4.3 prototype

  // (No polyfillable changes from ES5)

  // ---------------------------------------
  // 19.3 Boolean Objects
  // ---------------------------------------

  // 19.3.1 The Boolean Constructor
  // 19.3.1.1 Boolean ( value )
  // 19.3.2 Properties of the Boolean Constructor
  // 19.3.2.1 Boolean.prototype
  // 19.3.3 Properties of the Boolean Prototype Object
  // 19.3.3.1 Boolean.prototype.constructor
  // 19.3.3.2 Boolean.prototype.toString ( )
  // 19.3.3.3 Boolean.prototype.valueOf ( )
  // 19.3.4 Properties of Boolean Instances

  // (No polyfillable changes from ES5)

  // ---------------------------------------
  // 19.4 Symbol Objects
  // ---------------------------------------

  // Moved earlier in this script, so that other polyfills can depend on them.

  // 19.4.3.4 Symbol.prototype [ @@toStringTag ]
  define(global.Symbol.prototype, global.Symbol.toStringTag, 'Symbol');

  // ---------------------------------------
  // 19.5 Error Objects
  // ---------------------------------------

  // 19.5.1 The Error Constructor
  // 19.5.1.1 Error ( message )
  // 19.5.1.2 new Error( ...argumentsList )
  // 19.5.2 Properties of the Error Constructor
  // 19.5.2.1 Error.prototype
  // 19.5.3 Properties of the Error Prototype Object
  // 19.5.3.1 Error.prototype.constructor
  // 19.5.3.2 Error.prototype.message
  // 19.5.3.3 Error.prototype.name
  // 19.5.3.4 Error.prototype.toString ( )
  // 19.5.4 Properties of Error Instances
  // 19.5.5 Native Error Types Used in This Standard
  // 19.5.5.1 EvalError
  // 19.5.5.2 RangeError
  // 19.5.5.3 ReferenceError
  // 19.5.5.4 SyntaxError
  // 19.5.5.5 TypeError
  // 19.5.5.6 URIError
  // 19.5.6 NativeError Object Structure
  // 19.5.6.1 NativeError Constructors
  // 19.5.6.1.1 NativeError ( message )
  // 19.5.6.1.2 new NativeError ( ...argumentsList )
  // 19.5.6.2 Properties of the NativeError Constructors
  // 19.5.6.2.1 NativeError.prototype
  // 19.5.6.3 Properties of the NativeError Prototype Objects
  // 19.5.6.4 Properties of NativeError Instances

  // (No polyfillable changes from ES5)

  // ---------------------------------------
  // 20 Numbers and Dates
  // ---------------------------------------

  // ---------------------------------------
  // 20.1 Number Objects
  // ---------------------------------------

  // 20.1.1 The Number Constructor
  // 20.1.1.1 Number ( [ value ] )
  // 20.1.1.2 new Number ( ...argumentsList )
  // 20.1.2 Properties of the Number Constructor

  // 20.1.2.1 Number.EPSILON
  define(
    Number, 'EPSILON',
    (function () {
      var next, result;
      for (next = 1; 1 + next !== 1; next = next / 2)
        result = next;
      return result;
    }()));

  // 20.1.2.2 Number.isFinite ( number )
  define(
    Number, 'isFinite',
    function isFinite(number) {
      if (Type(number) !== 'number') return false;
      if (number !== number || number === +Infinity || number === -Infinity) return false;
      return true;
    });

  // 20.1.2.3 Number.isInteger ( number )
  define(
    Number, 'isInteger',
    function isInteger(number) {
      if (Type(number) !== 'number') return false;
      if (number !== number || number === +Infinity || number === -Infinity) return false;
      var integer = ToInteger(number);
      if (integer !== number) return false;
      return true;
    });

  // 20.1.2.4 Number.isNaN ( number )
  define(
    Number, 'isNaN',
    function isNaN(number) {
      if (Type(number) !== 'number') return false;
      if (number !== number) return true;
      return false;
    });

  // 20.1.2.5 Number.isSafeInteger ( number )
  define(
    Number, 'isSafeInteger',
    function isSafeInteger(number) {
      if (Type(number) !== 'number') return false;
      if (number !== number || number === +Infinity || number === -Infinity) return false;
      var integer = ToInteger(number);
      if (integer !== number) return false;
      if (abs(integer) <= (0x20000000000000 - 1)) // 2^53-1
        return true;
      return false;
    });

  // 20.1.2.6 Number.MAX_SAFE_INTEGER
  define(
    Number, 'MAX_SAFE_INTEGER',
    9007199254740991); // 2^53-1

  // 20.1.2.7 Number.MAX_VALUE

  // 20.1.2.8 Number.MIN_SAFE_INTEGER
  define(
    Number, 'MIN_SAFE_INTEGER',
    -9007199254740991); // -2^53+1

  // 20.1.2.9 Number.MIN_VALUE
  // 20.1.2.10 Number.NaN
  // 20.1.2.11 Number.NEGATIVE_INFINITY

  // 20.1.2.12 Number.parseFloat ( string )
  define(Number, 'parseFloat', $parseFloat);

  // 20.1.2.13 Number.parseInt ( string, radix )
  define(Number, 'parseInt', $parseInt);

  // 20.1.2.14 Number.POSITIVE_INFINITY
  // 20.1.2.15 Number.prototype

  // 20.1.3 Properties of the Number Prototype Object
  // 20.1.3.1 Number.prototype.constructor
  // 20.1.3.2 Number.prototype.toExponential ( fractionDigits )
  // 20.1.3.3 Number.prototype.toFixed ( fractionDigits )
  // 20.1.3.4 Number.prototype.toLocaleString( [ reserved1 [ , reserved2 ] ])
  // 20.1.3.5 Number.prototype.toPrecision ( precision )
  // 20.1.3.6 Number.prototype.toString ( [ radix ] )
  // 20.1.3.7 Number.prototype.valueOf ( )
  // 20.1.4 Properties of Number Instances

  // ---------------------------------------
  // 20.2 The Math Object
  // ---------------------------------------

  // 20.2.1 Value Properties of the Math Object
  // 20.2.1.1 Math.E
  // 20.2.1.2 Math.LN10
  // 20.2.1.3 Math.LN2
  // 20.2.1.4 Math.LOG10E
  // 20.2.1.5 Math.LOG2E
  // 20.2.1.6 Math.PI
  // 20.2.1.7 Math.SQRT1_2
  // 20.2.1.8 Math.SQRT2

  // 20.2.1.9 Math [ @@toStringTag ]
  define(Math, $$toStringTag, 'Math');

  // 20.2.2 Function Properties of the Math Object
  // 20.2.2.1 Math.abs ( x )
  // 20.2.2.2 Math.acos ( x )

  // 20.2.2.3 Math.acosh(x)
  define(
    Math, 'acosh',
    function acosh(x) {
      x = Number(x);
      return log(x + sqrt(x * x - 1));
    });

  // 20.2.2.4 Math.asin ( x )

  // 20.2.2.5 Math.asinh( x )
  define(
    Math, 'asinh',
    function asinh(x) {
      x = Number(x);
      if (SameValue(x, -0)) {
        return x;
      }
      var s = sqrt(x * x + 1);
      return (s === -x) ? log(0) : log(x + s);
    });

  // 20.2.2.6 Math.atan ( x )

  // 20.2.2.7 Math.atanh( x )
  define(
    Math, 'atanh',
    function atanh(x) {
      x = Number(x);
      return (x === 0) ? x : log((1 + x) / (1 - x)) / 2;
    });

  // 20.2.2.8 Math.atan2 ( y, x )

  // 20.2.2.9 Math.cbrt ( x )
  define(
    Math, 'cbrt',
    function cbrt(x) {
      x = Number(x);
      if ($isNaN(x/x)) {
        return x;
      }
      var r = pow(abs(x), 1/3);
      var t = x/r/r;
      return r + (r * (t-r) / (2*r + t));
    });

  // 20.2.2.10 Math.ceil ( x )

  // 20.2.2.11 Math.clz32 ( x )
  define(
    Math, 'clz32',
    function clz32(x) {
      function clz8(x) {
        return (x & 0xf0) ? (x & 0x80 ? 0 : x & 0x40 ? 1 : x & 0x20 ? 2 : 3) :
        (x & 0x08 ? 4 : x & 0x04 ? 5 : x & 0x02 ? 6 : x & 0x01 ? 7 : 8);
      }
      x = ToUint32(x);
      return x & 0xff000000 ? clz8(x >> 24) :
        x & 0xff0000 ? clz8(x >> 16) + 8 :
        x & 0xff00 ? clz8(x >> 8) + 16 : clz8(x) + 24;
    });



  // 20.2.2.12 Math.cos ( x )

  // 20.2.2.13 Math.cosh ( x )
  define(
    Math, 'cosh',
    function cosh(x) {
      x = Number(x);
      return (pow(E, x) + pow(E, -x)) / 2;
    });

  // 20.2.2.14 Math.exp ( x )

  // 20.2.2.15 Math.expm1 ( x )
  define(
    Math, 'expm1',
    function expm1(x) {
      x = Number(x);
      // from: http://www.johndcook.com/cpp_log1p.html
      if (SameValue(x, -0)) {
        return -0;
      } else if (abs(x) < 1e-5) {
        return x + 0.5 * x * x; // two terms of Taylor expansion
      } else {
        return exp(x) - 1;
      }
    });

  // 20.2.2.16 Math.floor ( x )

  // 20.2.2.17 Math.fround ( x )
  define(
    Math, 'fround',
    function fround(x) {
      if ($isNaN(x)) {
        return NaN;
      }
      if (1/x === +Infinity || 1/x === -Infinity || x === +Infinity || x === -Infinity) {
        return x;
      }
      return (new Float32Array([x]))[0];
    });

  // 20.2.2.18 Math.hypot ( value1 [, value2 [ ... ] ] )
  define(
    Math, 'hypot',
    function hypot() {
      var values = [];
      var m = 0, sawNaN = false;
      for (var i = 0; i < arguments.length; ++i) {
        var n = abs(Number(arguments[i]));
        if (n === Infinity) return n;
        if (n !== n) sawNaN = true;
        if (n > m) m = n;
        values[i] = n;
      }
      if (sawNaN) return NaN;
      if (m === 0) return +0;
      var sum = +0;
      for (i = 0; i < values.length; ++i) {
        var r = values[i] / m;
        sum = sum + r * r;
      }
      return m * sqrt(sum);
    });

  // 20.2.2.19 Math.imul ( x, y )
  define(
    Math, 'imul',
    function imul(x, y) {
      var a = ToUint32(x);
      var b = ToUint32(y);
      // (slow but accurate)
      var ah  = (a >>> 16) & 0xffff;
      var al = a & 0xffff;
      var bh  = (b >>> 16) & 0xffff;
      var bl = b & 0xffff;
      return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
    }, ('imul' in Math && Math.imul(1, 0x80000000) === 0) // Safari 7 bug
  );

  // 20.2.2.20 Math.log ( x )

  // 20.2.2.21 Math.log1p ( x )
  define(
    Math, 'log1p',
    function log1p(x) {
      x = Number(x);
      // from: http://www.johndcook.com/cpp_expm1.html
      if (x < -1) {
        return NaN;
      } else if (SameValue(x, -0)) {
        return -0;
      } else if (abs(x) > 1e-4) {
        return log(1 + x);
      } else {
        return (-0.5 * x + 1) * x;
      }
    });

  // 20.2.2.22 Math.log10 ( x )
  define(
    Math, 'log10',
    function log10(x) {
      x = Number(x);
      return log(x) * LOG10E;
    });

  // 20.2.2.23 Math.log2 ( x )
  define(
    Math, 'log2',
    function log2(x) {
      x = Number(x);
      return log(x) * LOG2E;
    });

  // 20.2.2.24 Math.max ( value1, value2 , ...values )
  // 20.2.2.25 Math.min ( value1, value2 , ...values )
  // 20.2.2.26 Math.pow ( x, y )
  // 20.2.2.27 Math.random ( )
  // 20.2.2.28 Math.round ( x )

  // 20.2.2.29 Math.sign(x)
  define(
    Math, 'sign',
    function sign(x) {
      x = Number(x);
      return x < 0 ? -1 : x > 0 ? 1 : x;
    });

  // 20.2.2.30 Math.sin ( x )

  // 20.2.2.31 Math.sinh( x )
  define(
    Math, 'sinh',
    function sinh(x) {
      x = Number(x);
      return SameValue(x, -0) ? x : (pow(E, x) - pow(E, -x)) / 2;
    });

  // 20.2.2.32 Math.sqrt ( x )
  // 20.2.2.33 Math.tan ( x )

  // 20.2.2.34 Math.tanh ( x )
  define(
    Math, 'tanh',
    function tanh(x) {
      x = Number(x);
      var n = pow(E, 2 * x) - 1,
          d = pow(E, 2 * x) + 1;
      if (SameValue(x, -0))
        return x;
      return (n === d) ? 1 : n / d; // Handle Infinity/Infinity
    });

  // 20.2.2.35 Math.trunc ( x )
  define(
    Math, 'trunc',
    function trunc(x) {
      x = Number(x);
      return $isNaN(x) ? NaN :
        x < 0 ? ceil(x) : floor(x);
    });

  // ---------------------------------------
  // 20.3 Date Objects
  // ---------------------------------------

  // 20.3.1 Overview of Date Objects and Definitions of Abstract Operations
  // 20.3.1.1 Time Values and Time Range
  // 20.3.1.2 Day Number and Time within Day
  // 20.3.1.3 Year Number
  // 20.3.1.4 Month Number
  // 20.3.1.5 Date Number
  // 20.3.1.6 Week Day
  // 20.3.1.7 Local Time Zone Adjustment
  // 20.3.1.8 Daylight Saving Time Adjustment
  // 20.3.1.9 Local Time
  // 20.3.1.10 Hours, Minutes, Second, and Milliseconds
  // 20.3.1.11 MakeTime (hour, min, sec, ms)
  // 20.3.1.12 MakeDay (year, month, date)
  // 20.3.1.13 MakeDate (day, time)
  // 20.3.1.14 TimeClip (time)
  // 20.3.1.15 Date Time String Format
  // 20.3.1.15.1 Extended years
  // 20.3.2 The Date Constructor
  // 20.3.2.1 Date ( year, month [, date [ , hours [ , minutes [ , seconds [ , ms ] ] ] ] ] )
  // 20.3.2.2 Date ( value )
  // 20.3.2.3 Date ( )
  // 20.3.3 Properties of the Date Constructor
  // 20.3.3.1 Date.now ( )
  // 20.3.3.2 Date.parse (string)
  // 20.3.3.3 Date.prototype
  // 20.3.3.4 Date.UTC ( year, month [ , date [ , hours [ , minutes [ , seconds [ , ms ] ] ] ] ] )
  // 20.3.4 Properties of the Date Prototype Object
  // 20.3.4.1 Date.prototype.constructor
  // 20.3.4.2 Date.prototype.getDate ( )
  // 20.3.4.3 Date.prototype.getDay ( )
  // 20.3.4.4 Date.prototype.getFullYear ( )
  // 20.3.4.5 Date.prototype.getHours ( )
  // 20.3.4.6 Date.prototype.getMilliseconds ( )
  // 20.3.4.7 Date.prototype.getMinutes ( )
  // 20.3.4.8 Date.prototype.getMonth ( )
  // 20.3.4.9 Date.prototype.getSeconds ( )
  // 20.3.4.10 Date.prototype.getTime ( )
  // 20.3.4.11 Date.prototype.getTimezoneOffset ( )
  // 20.3.4.12 Date.prototype.getUTCDate ( )
  // 20.3.4.13 Date.prototype.getUTCDay ( )
  // 20.3.4.14 Date.prototype.getUTCFullYear ( )
  // 20.3.4.15 Date.prototype.getUTCHours ( )
  // 20.3.4.16 Date.prototype.getUTCMilliseconds ( )
  // 20.3.4.17 Date.prototype.getUTCMinutes ( )
  // 20.3.4.18 Date.prototype.getUTCMonth ( )
  // 20.3.4.19 Date.prototype.getUTCSeconds ( )
  // 20.3.4.20 Date.prototype.setDate ( date )
  // 20.3.4.21 Date.prototype.setFullYear ( year [ , month [ , date ] ] )
  // 20.3.4.22 Date.prototype.setHours ( hour [ , min [ , sec [ , ms ] ] ] )
  // 20.3.4.23 Date.prototype.setMilliseconds ( ms )
  // 20.3.4.24 Date.prototype.setMinutes ( min [ , sec [ , ms ] ] )
  // 20.3.4.25 Date.prototype.setMonth ( month [ , date ] )
  // 20.3.4.26 Date.prototype.setSeconds ( sec [ , ms ] )
  // 20.3.4.27 Date.prototype.setTime ( time )
  // 20.3.4.28 Date.prototype.setUTCDate ( date )
  // 20.3.4.29 Date.prototype.setUTCFullYear ( year [ , month [ , date ] ] )
  // 20.3.4.30 Date.prototype.setUTCHours ( hour [ , min [ , sec [ , ms ] ] ] )
  // 20.3.4.31 Date.prototype.setUTCMilliseconds ( ms )
  // 20.3.4.32 Date.prototype.setUTCMinutes ( min [ , sec [, ms ] ] )
  // 20.3.4.33 Date.prototype.setUTCMonth ( month [ , date ] )
  // 20.3.4.34 Date.prototype.setUTCSeconds ( sec [ , ms ] )
  // 20.3.4.35 Date.prototype.toDateString ( )
  // 20.3.4.36 Date.prototype.toISOString ( )
  // 20.3.4.37 Date.prototype.toJSON ( key )
  // 20.3.4.38 Date.prototype.toLocaleDateString ( [ reserved1 [ , reserved2 ] ] )
  // 20.3.4.39 Date.prototype.toLocaleString ( [ reserved1 [ , reserved2 ] ] )
  // 20.3.4.40 Date.prototype.toLocaleTimeString ( [ reserved1 [ , reserved2 ] ] )
  // 20.3.4.41 Date.prototype.toString ( )
  // 20.3.4.42 Date.prototype.toTimeString ( )
  // 20.3.4.43 Date.prototype.toUTCString ( )
  // 20.3.4.44 Date.prototype.valueOf ( )
  // 20.3.4.45 Date.prototype [ @@toPrimitive ] ( hint )
  // 20.3.5 Properties of Date Instances

  // (No polyfillable changes from ES5)

  // ---------------------------------------
  // 21 Text Processing
  // ---------------------------------------

  var string_regexp_dispatch = (function() {
    var faux = {}, secret = Symbol();
    faux[Symbol.match] = function() { return secret; };
    return ("").match(faux) === secret;
  }());

  // 21.1 String Objects
  // 21.1.1 The String Constructor
  // 21.1.1.1 String ( value )
  // 21.1.2 Properties of the String Constructor
  // 21.1.2.1 String.fromCharCode ( ...codeUnits )

  // 21.1.2.2 String.fromCodePoint ( ...codePoints )
  define(
    String, 'fromCodePoint',
    function fromCodePoint(/*...codePoints*/) {
      var codePoints = arguments,
          length = codePoints.length,
          elements = [],
          nextIndex = 0;
      while (nextIndex < length) {
        var next = codePoints[nextIndex];
        var nextCP = Number(next);
        if (!SameValue(nextCP, ToInteger(nextCP)) ||
            nextCP < 0 || nextCP > 0x10FFFF) {
          throw RangeError('Invalid code point ' + nextCP);
        }
        if (nextCP < 0x10000) {
          elements.push(String.fromCharCode(nextCP));
        } else {
          nextCP -= 0x10000;
          elements.push(String.fromCharCode((nextCP >> 10) + 0xD800));
          elements.push(String.fromCharCode((nextCP % 0x400) + 0xDC00));
        }
        nextIndex += 1;
      }
      return elements.join('');
    });

  // 21.1.2.3 String.prototype

  // 21.1.2.4 String.raw ( template , ...substitutions )
  define(
    String, 'raw',
    function raw(template /*, ...substitutions*/) {
      var substitutions = [].slice.call(arguments, 1);

      var cooked = Object(template);
      var rawValue = cooked['raw'];
      var raw = Object(rawValue);
      var len = raw['length'];
      var literalSegments = ToLength(len);
      if (literalSegments <= 0) return '';
      var stringElements = [];
      var nextIndex = 0;
      while (true) {
        var next = raw[nextIndex];
        var nextSeg = String(next);
        stringElements.push(nextSeg);
        if (nextIndex + 1 === literalSegments)
          return stringElements.join('');
        next = substitutions[nextIndex];
        var nextSub = String(next);
        stringElements.push(nextSub);
        nextIndex = nextIndex + 1;
      }
    });

  // See https://githib.com/inexorabletash/uate for a more useful version.

  // 21.1.3 Properties of the String Prototype Object
  // 21.1.3.1 String.prototype.charAt ( pos )
  // 21.1.3.2 String.prototype.charCodeAt ( pos )

  // 21.1.3.3 String.prototype.codePointAt ( pos )
  define(
    String.prototype, 'codePointAt',
    function codePointAt(pos) {
      var o = strict(this);
      var s = String(o);
      var position = ToInteger(pos);
      var size = s.length;
      if (position < 0 || position >= size) return undefined;
      var first = s.charCodeAt(position);
      if (first < 0xD800 || first > 0xDBFF || position + 1 === size) return first;
      var second = s.charCodeAt(position + 1);
      if (second < 0xDC00 || second > 0xDFFF) return first;
      return ((first - 0xD800) * 1024) + (second - 0xDC00) + 0x10000;
    });

  // 21.1.3.4 String.prototype.concat ( ...args )
  // 21.1.3.5 String.prototype.constructor

  // 21.1.3.6 String.prototype.endsWith ( searchString [ , endPosition] )
  define(
    String.prototype, 'endsWith',
    function endsWith(searchString) {
      var endPosition = arguments[1];

      var o = strict(this);
      var s = String(o);
      var searchStr = String(searchString);
      var len = s.length;
      var pos = (endPosition === undefined) ? len : ToInteger(endPosition);
      var end = min(max(pos, 0), len);
      var searchLength = searchStr.length;
      var start = end - searchLength;
      if (start < 0) return false;
      if (s.substring(start, start + searchLength) === searchStr) return true;
      return false;
    });

  // 21.1.3.7 String.prototype.includes ( searchString [ , position ] )
  define(
    String.prototype, 'includes',
    function includes(searchString) {
      var position = arguments[1];

      var o = strict(this);
      var s = String(o);
      var searchStr = String(searchString);
      var pos = ToInteger(position);
      var len = s.length;
      var start = min(max(pos, 0), len);
      return s.indexOf(searchStr, start) !== -1;
    });

  // 21.1.3.8 String.prototype.indexOf ( searchString [ , position ] )
  // 21.1.3.9 String.prototype.lastIndexOf ( searchString [ , position ] )
  // 21.1.3.10 String.prototype.localeCompare ( that [, reserved1 [ , reserved2 ] ] )
  // 21.1.3.11 String.prototype.match ( regexp )
  define(
    String.prototype, 'match',
    function match(regexp) {
      var o = strict(this);
      var s = String(o);
      if (HasProperty(regexp, $$match)) var rx = regexp;
      else rx = new RegExp(regexp);
      return rx[$$match](s);
    }, !string_regexp_dispatch);

  // 21.1.3.12 String.prototype.normalize ( [ form ] )

  // Not practical due to table sizes; if needed, pull in:
  // https://github.com/walling/unorm/

  // 21.1.3.13 String.prototype.repeat ( count )
  define(
    String.prototype, 'repeat',
    function repeat(count) {
      var o = strict(this);
      var s = String(o);
      var n = ToInteger(count);
      if (n < 0) throw RangeError();
      if (n === Infinity) throw RangeError();
      var t = new Array(n + 1).join(s);
      return t;
    });

  // 21.1.3.14 String.prototype.replace (searchValue, replaceValue )
  define(
    String.prototype, 'replace',
    function replace(searchValue, replaceValue) {
      var o = strict(this);
      if (HasProperty(searchValue, $$replace))
        return searchValue[$$replace](o, replaceValue);
      return orig_replace.call(o, searchValue, replaceValue);
    }, !string_regexp_dispatch);

  // 21.1.3.15 String.prototype.search ( regexp )
  define(
    String.prototype, 'search',
    function search(regexp) {
      var o = strict(this);
      var string = String(o);
      if (HasProperty(regexp, $$search)) var rx = regexp;
      else rx = new RegExp(regexp);
      return rx[$$search](string);
    }, !string_regexp_dispatch);

  // 21.1.3.16 String.prototype.slice ( start, end )
  // 21.1.3.17 String.prototype.split ( separator, limit )
  define(
    String.prototype, 'split',
    function split(separator, limit) {
      var o = strict(this);
      if (HasProperty(separator, $$split))
        return separator[$$split](o, limit);
      return orig_split.call(o, separator, limit);
    }, !string_regexp_dispatch);

  // 21.1.3.18 String.prototype.startsWith ( searchString [, position ] )
  define(
    String.prototype, 'startsWith',
    function startsWith(searchString) {
      var position = arguments[1];

      var o = strict(this);
      var s = String(o);
      var searchStr = String(searchString);
      var pos = ToInteger(position);
      var len = s.length;
      var start = min(max(pos, 0), len);
      var searchLength = searchStr.length;
      if (searchLength + start > len) return false;
      if (s.substring(start, start + searchLength) === searchStr) return true;
      return false;
    });

  // 21.1.3.19 String.prototype.substring ( start, end )
  // 21.1.3.20 String.prototype.toLocaleLowerCase ( [ reserved1 [ , reserved2 ] ] )
  // 21.1.3.21 String.prototype.toLocaleUpperCase ([ reserved1 [ , reserved2 ] ] )
  // 21.1.3.22 String.prototype.toLowerCase ( )
  // 21.1.3.23 String.prototype.toString ( )
  // 21.1.3.24 String.prototype.toUpperCase ( )
  // 21.1.3.25 String.prototype.trim ( )
  // 21.1.3.26 String.prototype.valueOf ( )

  // 21.1.3.27 String.prototype [ @@iterator ]( )
  define(
    String.prototype, $$iterator,
    function entries() {
      return CreateStringIterator(this, 'value');
    });

  // 21.1.4 Properties of String Instances
  // 21.1.4.1 length

  // 21.1.5 String Iterator Objects
  /** @constructor */
  function StringIterator() {}

  // 21.1.5.1 CreateStringIterator Abstract Operation
  function CreateStringIterator(string, kind) {
    var s = String(string);
    var iterator = new StringIterator;
    set_internal(iterator, '[[IteratedString]]', s);
    set_internal(iterator, '[[StringIteratorNextIndex]]', 0);
    set_internal(iterator, '[[StringIterationKind]]', kind);
    return iterator;
  }

  // 21.1.5.2 The %StringIteratorPrototype% Object
  var $StringIteratorPrototype$ = Object.create($IteratorPrototype$);
  StringIterator.prototype = $StringIteratorPrototype$;

  // 21.1.5.2.1 %StringIteratorPrototype%.next ( )
  define(
    $StringIteratorPrototype$, 'next',
    function next() {
      var o = ToObject(this);
      var s = String(o['[[IteratedString]]']),
          index = o['[[StringIteratorNextIndex]]'],
          len = s.length;
      if (index >= len) {
        set_internal(o, '[[StringIteratorNextIndex]]', Infinity);
        return CreateIterResultObject(undefined, true);
      }
      var cp = s.codePointAt(index);
      set_internal(o, '[[StringIteratorNextIndex]]', index + (cp > 0xFFFF ? 2 : 1));
      return CreateIterResultObject(String.fromCodePoint(cp), false);
    });

  // 21.1.5.2.2 %StringIteratorPrototype% [ @@toStringTag ]
  define($StringIteratorPrototype$, $$toStringTag, 'String Iterator');

  // 21.1.5.3 Properties of String Iterator Instances

  // ---------------------------------------
  // 21.2 RegExp (Regular Expression) Objects
  // ---------------------------------------

  // 21.2.1 Patterns
  // 21.2.2 Pattern Semantics
  // 21.2.2.1 Notation
  // 21.2.2.2 Pattern
  // 21.2.2.3 Disjunction
  // 21.2.2.4 Alternative
  // 21.2.2.5 Term
  // 21.2.2.6 Assertion
  // 21.2.2.7 Quantifier
  // 21.2.2.8 Atom
  // 21.2.2.9 AtomEscape
  // 21.2.2.10 CharacterEscape
  // 21.2.2.11 DecimalEscape
  // 21.2.2.12 CharacterClassEscape
  // 21.2.2.13 CharacterClass
  // 21.2.2.14 ClassRanges
  // 21.2.2.15 NonemptyClassRanges
  // 21.2.2.16 NonemptyClassRangesNoDash
  // 21.2.2.17 ClassAtom
  // 21.2.2.18 ClassAtomNoDash
  // 21.2.2.19 ClassEscape
  // 21.2.3 The RegExp Constructor
  // 21.2.3.1 RegExp ( pattern, flags )
  // 21.2.3.2 new RegExp( ...argumentsList )
  // 21.2.3.3 Abstract Operations for the RegExp Constructor
  // 21.2.4 Properties of the RegExp Constructor
  // 21.2.4.1 RegExp.prototype
  // 21.2.5 Properties of the RegExp Prototype Object
  // 21.2.5.1 RegExp.prototype.constructor
  // 21.2.5.2 RegExp.prototype.exec ( string )

  // 21.2.5.3 get RegExp.prototype.flags
  if (!('flags' in RegExp.prototype)) {
    Object.defineProperty(
      RegExp.prototype, 'flags', {
        get: function() {
          var s = String(this);
          return s.substring(s.lastIndexOf('/') + 1);
        }
      });
  }

  // 21.2.5.4 get RegExp.prototype.global
  // 21.2.5.5 get RegExp.prototype.ignoreCase

  // 21.2.5.6 RegExp.prototype [ @@match ] ( string )
  define(RegExp.prototype, $$match, function(string) {
    var o = strict(this);
    return orig_match.call(string, o);
  });

  // 21.2.5.7 get RegExp.prototype.multiline

  // 21.2.5.8 RegExp.prototype [ @@replace ] ( string, replaceValue )
  define(RegExp.prototype, $$replace, function(string, replaceValue) {
    var o = strict(this);
    return orig_replace.call(string, o, replaceValue);
  });

  // 21.2.5.9 RegExp.prototype [ @@search ] ( string )
  define(RegExp.prototype, $$search, function(string) {
    var o = strict(this);
    return orig_search.call(string, o);
  });

  // 21.2.5.10 get RegExp.prototype.source

  // 21.2.5.11 RegExp.prototype [ @@split ] ( string, limit )
  define(RegExp.prototype, $$split, function(string, limit) {
    var o = strict(this);
    return orig_split.call(string, o, limit);
  });

  // 21.2.5.12 get RegExp.prototype.sticky
  // 21.2.5.13 RegExp.prototype.test( S )
  // 21.2.5.14 RegExp.prototype.toString ( )
  // 21.2.5.15 get RegExp.prototype.unicode

  // 21.2.6 Properties of RegExp Instances
  // 21.2.6.1 lastIndex

  // (No polyfillable changes from ES5)

  // ---------------------------------------
  // 22 Indexed Collections
  // ---------------------------------------

  // ---------------------------------------
  // 22.1 Array Objects
  // ---------------------------------------

  // 22.1.1 The Array Constructor
  // 22.1.1.1 Array ( )
  // 22.1.1.2 Array (len)
  // 22.1.1.3 Array (...items )

  // 22.1.2 Properties of the Array Constructor

  // 22.1.2.1 Array.from ( items [ , mapfn [ , thisArg ] ] )
  define(
    Array, 'from',
    function from(items) {
      var mapfn = arguments[1];
      var thisArg = arguments[2];

      var c = strict(this);
      if (mapfn === undefined) {
        var mapping = false;
      } else {
        if (!IsCallable(mapfn)) throw TypeError();
        var t = thisArg;
        mapping = true;
      }
      var usingIterator = GetMethod(items, $$iterator);
      if (usingIterator !== undefined) {
         if (IsConstructor(c)) {
          var a = new c();
        } else {
          a = new Array(0);
        }
        var iterator = GetIterator(items, usingIterator);
        var k = 0;
        while (true) {
          var next = IteratorStep(iterator);
          if (next === false) {
            a.length = k;
            return a;
          }
          var nextValue = IteratorValue(next);
          if (mapping)
            var mappedValue = mapfn.call(t, nextValue);
          else
            mappedValue = nextValue;
          a[k] = mappedValue;
          k += 1;
        }
      }
      var arrayLike = ToObject(items);
      var lenValue = arrayLike.length;
      var len = ToLength(lenValue);
      if (IsConstructor(c)) {
        a = new c(len);
      } else {
        a = new Array(len);
      }
      k = 0;
      while (k < len) {
        var kValue = arrayLike[k];
        if (mapping)
          mappedValue = mapfn.call(t, kValue, k);
        else
          mappedValue = kValue;
        a[k] = mappedValue;
        k += 1;
      }
      a.length = len;
      return a;
    });

  // 22.1.2.2 Array.isArray ( arg )

  // 22.1.2.3 Array.of ( ...items )
  define(
    Array, 'of',
    function of() {
      var items = arguments;

      var lenValue = items.length;
      var len = ToUint32(lenValue);
      var c = strict(this), a;
      if (IsConstructor(c)) {
        a = new c(len);
        a = ToObject(a);
      } else {
        a = new Array(len);
      }
      var k = 0;
      while (k < len) {
        a[k] = items[k];
        k += 1;
      }
      a.length = len;
      return a;
    });

  // 22.1.2.4 Array.prototype
  // 22.1.2.5 get Array [ @@species ]
  // 22.1.3 Properties of the Array Prototype Object
  // 22.1.3.1 Array.prototype.concat ( ...arguments )
  // 22.1.3.1.1 Runtime Semantics: IsConcatSpreadable ( O )
  // 22.1.3.2 Array.prototype.constructor
  // 22.1.3.3 Array.prototype.copyWithin (target, start [ , end ] )
  define(
    Array.prototype, 'copyWithin',
    function copyWithin(target, start/*, end*/) {
      var end = arguments[2];

      var o = ToObject(this);
      var lenVal = o.length;
      var len = ToLength(lenVal);
      len = max(len, 0);
      var relativeTarget = ToInteger(target);
      var to;
      if (relativeTarget < 0)
        to = max(len + relativeTarget, 0);
      else
        to = min(relativeTarget, len);
      var relativeStart = ToInteger(start);
      var from;
      if (relativeStart < 0)
        from = max(len + relativeStart, 0);
      else
        from = min(relativeStart, len);
      var relativeEnd;
      if (end === undefined)
        relativeEnd = len;
      else
        relativeEnd = ToInteger(end);
      var final;
      if (relativeEnd < 0)
        final = max(len + relativeEnd, 0);
      else
        final = min(relativeEnd, len);
      var count = min(final - from, len - to);
      var direction;
      if (from < to && to < from + count) {
        direction = -1;
        from = from + count - 1;
        to = to + count - 1;
      } else {
        direction = 1;
      }
      while (count > 0) {
        var fromKey = String(from);
        var toKey = String(to);
        var fromPresent = HasProperty(o, fromKey);
        if (fromPresent) {
          var fromVal = o[fromKey];
          o[toKey] = fromVal;
        } else {
          delete o[toKey];
        }
        from = from + direction;
        to = to + direction;
        count = count - 1;
      }
      return o;
    });

  // 22.1.3.4 Array.prototype.entries ( )
  var nativeArrayIteratorMethods =
        ('entries' in Array.prototype && 'next' in [].entries());

  define(
    Array.prototype, 'entries',
    function entries() {
      return CreateArrayIterator(this, 'key+value');
    }, !nativeArrayIteratorMethods);

  // 22.1.3.5 Array.prototype.every ( callbackfn [ , thisArg] )

  // 22.1.3.6 Array.prototype.fill (value [ , start [ , end ] ] )
  define(
    Array.prototype, 'fill',
    function fill(value/*, start, end*/) {
      var start = arguments[1],
          end = arguments[2];

      var o = ToObject(this);
      var lenVal = o.length;
      var len = ToLength(lenVal);
      len = max(len, 0);
      var relativeStart = ToInteger(start);
      var k;
      if (relativeStart < 0)
        k = max((len + relativeStart), 0);
      else
        k = min(relativeStart, len);
      var relativeEnd;
      if (end === undefined)
        relativeEnd = len;
      else
        relativeEnd = ToInteger(end);
      var final;
      if (relativeEnd < 0)
        final = max((len + relativeEnd), 0);
      else
        final = min(relativeEnd, len);
      while (k < final) {
        var pk = String(k);
        o[pk] = value;
        k += 1;
      }
      return o;
    });

  // 22.1.3.7 Array.prototype.filter ( callbackfn [ , thisArg ] )

  // 22.1.3.8 Array.prototype.find ( predicate [ , thisArg ] )
  define(
    Array.prototype, 'find',
    function find(predicate) {
      var o = ToObject(this);
      var lenValue = o.length;
      var len = ToInteger(lenValue);
      if (!IsCallable(predicate)) throw TypeError();
      var t = arguments.length > 1 ? arguments[1] : undefined;
      var k = 0;
      while (k < len) {
        var pk = String(k);
        var kPresent = HasProperty(o, pk);
        if (kPresent) {
          var kValue = o[pk];
          var testResult = predicate.call(t, kValue, k, o);
          if (Boolean(testResult)) {
            return kValue;
          }
        }
        ++k;
      }
      return undefined;
    });

  // 22.1.3.9 Array.prototype.findIndex ( predicate [ , thisArg ] )
  define(
    Array.prototype, 'findIndex',
    function findIndex(predicate) {
      var o = ToObject(this);
      var lenValue = o.length;
      var len = ToLength(lenValue);
      if (!IsCallable(predicate)) throw TypeError();
      var t = arguments.length > 1 ? arguments[1] : undefined;
      var k = 0;
      while (k < len) {
        var pk = String(k);
        var kPresent = HasProperty(o, pk);
        if (kPresent) {
          var kValue = o[pk];
          var testResult = predicate.call(t, kValue, k, o);
          if (Boolean(testResult)) {
            return k;
          }
        }
        ++k;
      }
      return -1;
    });

  // 22.1.3.10 Array.prototype.forEach ( callbackfn [ , thisArg ] )
  // 22.1.3.11 Array.prototype.indexOf ( searchElement [ , fromIndex ] )
  // 22.1.3.12 Array.prototype.join (separator)

  // 22.1.3.13 Array.prototype.keys ( )
  define(
    Array.prototype, 'keys',
    function keys() {
      return CreateArrayIterator(this, 'key');
    }, !nativeArrayIteratorMethods);

  // 22.1.3.14 Array.prototype.lastIndexOf ( searchElement [ , fromIndex ] )
  // 22.1.3.15 Array.prototype.map ( callbackfn [ , thisArg ] )
  // 22.1.3.16 Array.prototype.pop ( )
  // 22.1.3.17 Array.prototype.push ( ...items )
  // 22.1.3.18 Array.prototype.reduce ( callbackfn [ , initialValue ] )
  // 22.1.3.19 Array.prototype.reduceRight ( callbackfn [ , initialValue ] )
  // 22.1.3.20 Array.prototype.reverse ( )
  // 22.1.3.21 Array.prototype.shift ( )
  // 22.1.3.22 Array.prototype.slice (start, end)
  // 22.1.3.23 Array.prototype.some ( callbackfn [ , thisArg ] )
  // 22.1.3.24 Array.prototype.sort (comparefn)
  // 22.1.3.25 Array.prototype.splice (start, deleteCount , ...items )
  // 22.1.3.26 Array.prototype.toLocaleString ( [ reserved1 [ , reserved2 ] ] )
  // 22.1.3.27 Array.prototype.toString ( )
  // 22.1.3.28 Array.prototype.unshift ( ...items )

  // 22.1.3.29 Array.prototype.values ( )
  define(
    Array.prototype, 'values',
    function values() {
      return CreateArrayIterator(this, 'value');
    }, !nativeArrayIteratorMethods);

  // 22.1.3.30 Array.prototype [ @@iterator ] ( )
  define(
    Array.prototype, $$iterator,
    Array.prototype.values
    );

  // 22.1.3.31 Array.prototype [ @@unscopables ]
  // 22.1.4 Properties of Array Instances
  // 22.1.4.1 length

  // 22.1.5 Array Iterator Objects
  function ArrayIterator() {}

  // 22.1.5.1 CreateArrayIterator Abstract Operation
  function CreateArrayIterator(array, kind) {
    var o = ToObject(array);
    var iterator = new ArrayIterator;
    set_internal(iterator, '[[IteratedObject]]', o);
    set_internal(iterator, '[[ArrayIteratorNextIndex]]', 0);
    set_internal(iterator, '[[ArrayIterationKind]]', kind);
    return iterator;
  }

  // 22.1.5.2 The %ArrayIteratorPrototype% Object
  var $ArrayIteratorPrototype$ = Object.create($IteratorPrototype$);
  ArrayIterator.prototype = $ArrayIteratorPrototype$;

  // 22.1.5.2.1 %ArrayIteratorPrototype%. next( )
  define(
    $ArrayIteratorPrototype$, 'next',
    function next() {
      var o = strict(this);
      if (Type(o) !== 'object') throw TypeError();
      var a = o['[[IteratedObject]]'],
          index = o['[[ArrayIteratorNextIndex]]'],
          itemKind = o['[[ArrayIterationKind]]'],
          lenValue = a.length,
          len = ToUint32(lenValue),
          elementKey,
          elementValue;
      if (itemKind.indexOf('sparse') !== -1) {
        var found = false;
        while (!found && index < len) {
          elementKey = String(index);
          found = HasProperty(a, elementKey);
          if (!found) {
            index += 1;
          }
        }
      }
      if (index >= len) {
        set_internal(o, '[[ArrayIteratorNextIndex]]', Infinity);
        return CreateIterResultObject(undefined, true);
      }
      elementKey = index;
      set_internal(o, '[[ArrayIteratorNextIndex]]', index + 1);
      if (itemKind.indexOf('value') !== -1)
        elementValue = a[elementKey];
      if (itemKind.indexOf('key+value') !== -1)
        return CreateIterResultObject([elementKey, elementValue], false);
      if (itemKind.indexOf('key') !== -1)
        return CreateIterResultObject(elementKey, false);
      if (itemKind === 'value')
        return CreateIterResultObject(elementValue, false);
      throw Error('Internal error');
    });

  // 22.1.5.2.2 %ArrayIteratorPrototype% [ @@toStringTag ]
  define($ArrayIteratorPrototype$, $$toStringTag, 'Array Iterator');

  // 22.1.5.3 Properties of Array Iterator Instances


  // ---------------------------------------
  // 22.2 TypedArray Objects
  // ---------------------------------------

  // See typedarray.js for TypedArray polyfill

  ['Int8Array', 'Uint8Array', 'Uint8ClampedArray',
   'Int16Array', 'Uint16Array',
   'Int32Array', 'Uint32Array',
   'Float32Array', 'Float64Array'].forEach(function ($TypedArrayName$) {
     if (!($TypedArrayName$ in global))
       return;
     var $TypedArray$ = global[$TypedArrayName$];

     // 22.2.1 The %TypedArray% Intrinsic Object
     // 22.2.1.1 %TypedArray% ( length )
     // 22.2.1.2 %TypedArray% ( typedArray )
     // 22.2.1.3 %TypedArray% ( object )
     // 22.2.1.4 %TypedArray% ( buffer [ , byteOffset [ , length ] ] )
     // 22.2.1.5 %TypedArray% ( all other argument combinations )
     // 22.2.2 Properties of the %TypedArray% Intrinsic Object

     // 22.2.2.1 %TypedArray%.from ( source [ , mapfn [ , thisArg ] ] )
     define(
       $TypedArray$, 'from',
       function from(source) {
         var mapfn = arguments[1];
         var thisArg = arguments[2];

         var c = strict(this);
         if (!IsConstructor(c)) throw TypeError();
         if (mapfn === undefined) {
           var mapping = false;
         } else {
           if (IsCallable(mapfn)) throw TypeError();
           var t = thisArg;
           mapping = true;
         }
         var usingIterator = GetMethod(source, $$iterator);
         if (usingIterator !== undefined) {
           var iterator = GetIterator(source, usingIterator);
           var values = [];
           var next = true;
           while (next !== false) {
             next = IteratorStep(iterator);
             if (next !== false) {
               var nextValue = IteratorValue(next);
               values.push(nextValue);
             }
           }
           var len = values.length;
           var newObj = new c(len);
           var k = 0;
           while (k < len) {
             var kValue = values.shift();
             if (mapping) {
               var mappedValue = mapfn.call(t, kValue);
             } else {
               mappedValue = kValue;
             }
             newObj[k] = mappedValue;
             ++k;
           }
           console.assert(values.length === 0);
           return newObj;
         }
         var arrayLike = ToObject(source);
         var lenValue = arrayLike.length;
         len = ToLength(lenValue);
         newObj = new c(len);
         k = 0;
         while (k < len) {
           kValue = arrayLike[k];
           if (mapping) {
             mappedValue = mapfn.call(t, kValue, k);
           } else {
             mappedValue = kValue;
           }
           newObj[k] = mappedValue;
           ++k;
         }
         return newObj;
       });

     // 22.2.2.2 %TypedArray%.of ( ...items )
     define(
       $TypedArray$, 'of',
       function of() {
         var items = arguments;

         var len = items.length;
         var c = strict(this);
         var newObj = new c(len);
         var k = 0;
         while (k < len) {
           newObj[k] = items[k];
           ++k;
         }
         return newObj;
       });

     // 22.2.2.3 %TypedArray%.prototype
     // 22.2.2.4 get %TypedArray% [ @@species ]
     // 22.2.3 Properties of the %TypedArrayPrototype% Object
     // 22.2.3.1 get %TypedArray%.prototype.buffer
     // 22.2.3.2 get %TypedArray%.prototype.byteLength
     // 22.2.3.3 get %TypedArray%.prototype.byteOffset
     // 22.2.3.4 %TypedArray%.prototype.constructor

     // 22.2.3.5 %TypedArray%.prototype.copyWithin (target, start [, end ] )
     define($TypedArray$.prototype, 'copyWithin', Array.prototype.copyWithin);

     // 22.2.3.6 %TypedArray%.prototype.entries ( )
     define($TypedArray$.prototype, 'entries', Array.prototype.entries);

     // 22.2.3.7 %TypedArray%.prototype.every ( callbackfn [ , thisArg ] )
     define($TypedArray$.prototype, 'every', Array.prototype.every);

     // 22.2.3.8 %TypedArray%.prototype.fill (value [ , start [ , end ] ] )
     define(
       $TypedArray$.prototype, 'fill',
       //Array.prototype.fill // Doesn't work in Safari 7
       function fill(value/*, start, end*/) {
         var start = arguments[1],
             end = arguments[2];

         var o = ToObject(this);
         var lenVal = o.length;
         var len = ToLength(lenVal);
         len = max(len, 0);
         var relativeStart = ToInteger(start);
         var k;
         if (relativeStart < 0) k = max((len + relativeStart), 0);
         else k = min(relativeStart, len);
         var relativeEnd;
         if (end === undefined) relativeEnd = len;
         else relativeEnd = ToInteger(end);
         var final;
         if (relativeEnd < 0) final = max((len + relativeEnd), 0);
         else final = min(relativeEnd, len);
         while (k < final) {
           var pk = String(k);
           o[pk] = value;
           k += 1;
         }
         return o;
       });

     // 22.2.3.9 %TypedArray%.prototype.filter ( callbackfn [ , thisArg ] )
     define(
       $TypedArray$.prototype, 'filter',
       function filter(callbackfn) {
         var thisArg = arguments[1];

         var o = ToObject(this);
         var lenVal = o.length;
         var len = ToLength(lenVal);
         if (!IsCallable(callbackfn)) throw TypeError();
         var t = thisArg;
         var c = o.constructor;
         var kept = [];
         var k = 0;
         var captured = 0;
         while (k < len) {
           var kValue = o[k];
           var selected = callbackfn.call(t, kValue, k, o);
           if (selected) {
             kept.push(kValue);
             ++captured;
           }
           ++k;
         }
         var a = new c(captured);
         var n = 0;
         for (var i = 0; i < kept.length; ++i) {
           var e = kept[i];
           a[n] = e;
           ++n;
         }
         return a;
       });

     // 22.2.3.10 %TypedArray%.prototype.find (predicate [ , thisArg ] )
     define($TypedArray$.prototype, 'find', Array.prototype.find);

     // 22.2.3.11 %TypedArray%.prototype.findIndex ( predicate [ , thisArg ] )
     define($TypedArray$.prototype, 'findIndex', Array.prototype.findIndex);

     // 22.2.3.12 %TypedArray%.prototype.forEach ( callbackfn [ , thisArg ] )
     define($TypedArray$.prototype, 'forEach', Array.prototype.forEach);

     // 22.2.3.13 %TypedArray%.prototype.indexOf (searchElement [ , fromIndex ] )
     define($TypedArray$.prototype, 'indexOf', Array.prototype.indexOf);

     // 22.2.3.14 %TypedArray%.prototype.join ( separator )
     define($TypedArray$.prototype, 'join', Array.prototype.join);

     // 22.2.3.15 %TypedArray%.prototype.keys ( )
     define($TypedArray$.prototype, 'keys', Array.prototype.keys);

     // 22.2.3.16 %TypedArray%.prototype.lastIndexOf ( searchElement [ , fromIndex ] )
     define($TypedArray$.prototype, 'lastIndexOf', Array.prototype.lastIndexOf);

     // 22.2.3.17 get %TypedArray%.prototype.length

     // 22.2.3.18 %TypedArray%.prototype.map ( callbackfn [ , thisArg ] )
     define(
       $TypedArray$.prototype, 'map',
       function map(callbackfn) {
         var thisArg = arguments[1];

         var o = ToObject(this);
         var lenValue = o.length;
         var len = ToLength(lenValue);
         if (!IsCallable(callbackfn)) throw TypeError();
         var t = thisArg;
         var a = undefined;
         var c = o.constructor;
         if (IsConstructor(c))
           a = new c(len);
         if (a === undefined)
           a = new Array(len);
         var k = 0;
         while (k < len) {
           var kPresent = HasProperty(o, k);
           if (kPresent) {
             var kValue = o[k];
             var mappedValue = callbackfn.call(t, kValue, k, o);
             a[k] = mappedValue;
           }
           ++k;
         }
         return a;
       });

     // 22.2.3.19 %TypedArray%.prototype.reduce ( callbackfn [, initialValue] )
     define($TypedArray$.prototype, 'reduce', Array.prototype.reduce);

     // 22.2.3.20 %TypedArray%.prototype.reduceRight ( callbackfn [, initialValue] )
     define($TypedArray$.prototype, 'reduceRight', Array.prototype.reduceRight);

     // 22.2.3.21 %TypedArray%.prototype.reverse ( )
     define($TypedArray$.prototype, 'reverse', Array.prototype.reverse);

     // 22.2.3.22 %TypedArray%.prototype.set ( overloaded [ , offset ])
     // 22.2.3.22.1 %TypedArray%.prototype.set (array [ , offset ] )
     // 22.2.3.22.2 %TypedArray%.prototype.set(typedArray [, offset ] )

     // 22.2.3.23 %TypedArray%.prototype.slice ( start, end )
     define(
       $TypedArray$.prototype, 'slice',
       function slice(start, end) {
         var o = ToObject(this);
         var lenVal = o.length;
         var len = ToLength(lenVal);
         var relativeStart = ToInteger(start);
         var k = (relativeStart < 0) ? max(len + relativeStart, 0) : min(relativeStart, len);
         var relativeEnd = (end === undefined) ? len : ToInteger(end);
         var final = (relativeEnd < 0) ? max(len + relativeEnd, 0) : min(relativeEnd, len);
         var count = final - k;
         var c = o.constructor;
         if (IsConstructor(c)) {
           var a = new c(count);
         } else {
           throw TypeError();
         }
         var n = 0;
         while (k < final) {
           var kValue = o[k];
           a[n] = kValue;
           ++k;
           ++n;
         }
         return a;
       });

     // 22.2.3.24 %TypedArray%.prototype.some ( callbackfn [ , thisArg ] )
     define($TypedArray$.prototype, 'some', Array.prototype.some);

     // 22.2.3.25 %TypedArray%.prototype.sort ( comparefn )
     define(
       $TypedArray$.prototype, 'sort',
       function sort() {
         var comparefn = arguments[0];

         function sortCompare(x, y) {
           console.assert(Type(x) === 'number' && Type(y) === 'number');
           if (x !== x && y !== y) return +0;
           if (x !== x) return 1;
           if (y !== y) return -1;
           if (comparefn !== undefined) {
             return comparefn(x, y);
           }
           if (x < y) return -1;
           if (x > y) return 1;
           return +0;
         }
         return Array.prototype.sort.call(this, sortCompare);
       });

     // 22.2.3.26 %TypedArray%.prototype.subarray( [ begin [ , end ] ] )
     // 22.2.3.27 %TypedArray%.prototype.toLocaleString ([ reserved1 [ , reserved2 ] ])
     // 22.2.3.28 %TypedArray%.prototype.toString ( )

     // 22.2.3.29 %TypedArray%.prototype.values ( )
     define($TypedArray$.prototype, 'values', Array.prototype.values);

     // 22.2.3.30 %TypedArray%.prototype [ @@iterator ] ( )
     define(
       $TypedArray$.prototype, $$iterator,
       $TypedArray$.prototype.values
     );

     // 22.2.3.31 get %TypedArray%.prototype [ @@toStringTag ]
     define($TypedArray$.prototype, $$toStringTag, $TypedArrayName$);

     // 22.2.4 The TypedArray Constructors
     // 22.2.4.1TypedArray( ... argumentsList)
     // 22.2.5 Properties of the TypedArray Constructors
     // 22.2.5.1 TypedArray.BYTES_PER_ELEMENT
     // 22.2.5.2 TypedArray.prototype
     // 22.2.6 Properties of TypedArray Prototype Objects
     // 22.2.6.1 TypedArray.prototype.BYTES_PER_ELEMENT
     // 22.2.6.2 TypedArray.prototype.constructor
     // 22.2.7 Properties of TypedArray Instances
   });

  // ---------------------------------------
  // 23 Keyed Collection
  // ---------------------------------------

  // ---------------------------------------
  // 23.1 Map Objects
  // ---------------------------------------

  (function() {
    // 23.1.1 The Map Constructor

    // 23.1.1.1 Map ( [ iterable ] )
    /** @constructor */
    function Map(/*iterable*/) {
      var map = strict(this);
      var iterable = arguments[0];

      if (Type(map) !== 'object') throw TypeError();
      if ('[[MapData]]' in map) throw TypeError();

      if (iterable !== undefined) {
        var adder = map['set'];
        if (!IsCallable(adder)) throw TypeError();
        var iter = GetIterator(ToObject(iterable));
      }
      set_internal(map, '[[MapData]]', { keys: [], values: [] });
      if (iter === undefined) return map;
      while (true) {
        var next = IteratorStep(iter);
        if (next === false)
          return map;
        var nextItem = IteratorValue(next);
        if (Type(nextItem) !== 'object') throw TypeError();
        var k = nextItem[0];
        var v = nextItem[1];
        adder.call(map, k, v);
      }

      return map;
    }

    if (!('Map' in global) || OVERRIDE_NATIVE_FOR_TESTING ||
        (function() { try { new global.Map([]); return false; } catch (_) { return true; } }()) ||
        (function() { try { return !new global.Map().entries().next; } catch (_) { return true; } }()) ||
        (new global.Map([['a', 1]]).size !== 1))
      global.Map = Map;


    function MapDataIndexOf(mapData, key) {
      var i;
      if (key === key) return mapData.keys.indexOf(key);
      // Slow case for NaN
      for (i = 0; i < mapData.keys.length; i += 1)
        if (SameValueZero(mapData.keys[i], key)) return i;
      return -1;
    }

    // 23.1.1.2 new Map ( ... argumentsList )
    // 23.1.2 Properties of the Map Constructor
    // 23.1.2.1 Map.prototype
    var $MapPrototype$ = {};
    Map.prototype = $MapPrototype$;

    // 23.1.2.2 get Map [ @@species ]

    // 23.1.3 Properties of the Map Prototype Object
    // 23.1.3.1 Map.prototype.clear ()
    define(
      Map.prototype, 'clear',
      function clear() {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];
        entries.keys.length = 0;
        entries.values.length = 0;
        return undefined;
      });

    // 23.1.3.2 Map.prototype.constructor

    // 23.1.3.3 Map.prototype.delete ( key )
    define(
      Map.prototype, 'delete',
      function delete_(key) {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];
        var i = MapDataIndexOf(entries, key);
        if (i < 0) return false;
        entries.keys[i] = empty;
        entries.values[i] = empty;
        return true;
      });

    // 23.1.3.4 Map.prototype.entries ( )
    define(
      Map.prototype, 'entries',
      function entries() {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        return CreateMapIterator(m, 'key+value');
      });

    // 23.1.3.5 Map.prototype.forEach ( callbackfn [ , thisArg ] )
    define(
      Map.prototype, 'forEach',
      function forEach(callbackfn /*, thisArg*/) {
        var thisArg = arguments[1];

        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];

        if (!IsCallable(callbackfn)) {
          throw TypeError('First argument to forEach is not callable.');
        }
        for (var i = 0; i < entries.keys.length; ++i) {
          if (entries.keys[i] !== empty) {
            callbackfn.call(thisArg, entries.values[i], entries.keys[i], m);
          }
        }
        return undefined;
      });

    // 23.1.3.6 Map.prototype.get ( key )
    define(
      Map.prototype, 'get',
      function get(key) {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];
        var i = MapDataIndexOf(entries, key);
        if (i >= 0) return entries.values[i];
        return undefined;
      });

    // 23.1.3.7 Map.prototype.has ( key )
    define(
      Map.prototype, 'has',
      function has(key) {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];
        if (MapDataIndexOf(entries, key) >= 0) return true;
        return false;
      });

    // 23.1.3.8 Map.prototype.keys ( )
    define(
      Map.prototype, 'keys',
      function keys() {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        return CreateMapIterator(m, 'key');
      });

    // 23.1.3.9 Map.prototype.set ( key , value )
    define(
      Map.prototype, 'set',
      function set(key, value) {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        if (!('[[MapData]]' in m)) throw TypeError();
        if (m['[[MapData]]'] === undefined) throw TypeError();
        var entries = m['[[MapData]]'];
        var i = MapDataIndexOf(entries, key);
        if (i < 0) i = entries.keys.length;
        if (SameValue(key, -0)) key = 0;
        entries.keys[i] = key;
        entries.values[i] = value;
        return m;
      });

    // 23.1.3.10 get Map.prototype.size
    Object.defineProperty(
      Map.prototype, 'size', {
        get: function() {
          var m = strict(this);
          if (Type(m) !== 'object') throw TypeError();
          if (!('[[MapData]]' in m)) throw TypeError();
          if (m['[[MapData]]'] === undefined) throw TypeError();
          var entries = m['[[MapData]]'];
          var count = 0;
          for (var i = 0; i < entries.keys.length; ++i) {
            if (entries.keys[i] !== empty)
              count = count + 1;
          }
          return count;
        }
      });

    // 23.1.3.11 Map.prototype.values ( )
    define(
      Map.prototype, 'values',
      function values() {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        return CreateMapIterator(m, 'value');
      });

    // 23.1.3.12 Map.prototype [ @@iterator ]( )
    define(
      Map.prototype, $$iterator,
      function() {
        var m = strict(this);
        if (Type(m) !== 'object') throw TypeError();
        return CreateMapIterator(m, 'key+value');
      });

    // 23.1.3.13 Map.prototype [ @@toStringTag ]
    define(global.Map.prototype, $$toStringTag, 'Map');

    // 23.1.4 Properties of Map Instances
    // 23.1.5 Map Iterator Objects

    /** @constructor */
    function MapIterator() {}

    // 23.1.5.1 CreateMapIterator Abstract Operation
    function CreateMapIterator(map, kind) {
      if (Type(map) !== 'object') throw TypeError();
      if (!('[[MapData]]' in map)) throw TypeError();
      if (map['[[MapData]]'] === undefined) throw TypeError();
      var iterator = new MapIterator;
      set_internal(iterator, '[[Map]]', map);
      set_internal(iterator, '[[MapNextIndex]]', 0);
      set_internal(iterator, '[[MapIterationKind]]', kind);
      return iterator;
    }

    // 23.1.5.2 The %MapIteratorPrototype% Object
    var $MapIteratorPrototype$ = Object.create($IteratorPrototype$);
    MapIterator.prototype = $MapIteratorPrototype$;

    // 23.1.5.2.1 %MapIteratorPrototype%.next ( )
    define(
      $MapIteratorPrototype$, 'next',
      function next() {
        var o = strict(this);
        if (Type(o) !== 'object') throw TypeError();
        var m = o['[[Map]]'],
            index = o['[[MapNextIndex]]'],
            itemKind = o['[[MapIterationKind]]'],
            entries = m['[[MapData]]'];
        while (index < entries.keys.length) {
          var e = {key: entries.keys[index], value: entries.values[index]};
          index = index += 1;
          set_internal(o, '[[MapNextIndex]]', index);
          if (e.key !== empty) {
            if (itemKind === 'key') {
              return CreateIterResultObject(e.key, false);
            } else if (itemKind === 'value') {
              return CreateIterResultObject(e.value, false);
            } else {
              return CreateIterResultObject([e.key, e.value], false);
            }
          }
        }
        return CreateIterResultObject(undefined, true);
      });

    // 23.1.5.2.2 %MapIteratorPrototype% [ @@toStringTag ]
    define($MapIteratorPrototype$, $$toStringTag, 'Map Iterator');

    // 23.1.5.3 Properties of Map Iterator Instances
  }());

  // ---------------------------------------
  // 23.2 Set Objects
  // ---------------------------------------

  (function() {
    // 23.2.1 The Set Constructor
    // 23.2.1.1 Set ( [ iterable ] )

    /** @constructor */
    function Set(/*iterable*/) {
      var set = strict(this);
      var iterable = arguments[0];

      if (Type(set) !== 'object') throw TypeError();
      if ('[[SetData]]' in set) throw TypeError();

      if (iterable !== undefined) {
        var adder = set['add'];
        if (!IsCallable(adder)) throw TypeError();
        var iter = GetIterator(ToObject(iterable));
      }
      set_internal(set, '[[SetData]]', []);
      if (iter === undefined) return set;
      while (true) {
        var next = IteratorStep(iter);
        if (next === false)
          return set;
        var nextValue = IteratorValue(next);
        adder.call(set, nextValue);
      }

      return set;
    }

    if (!('Set' in global) || OVERRIDE_NATIVE_FOR_TESTING ||
        (function() { try { return !new global.Set().entries().next; } catch (_) { return true; } }()) ||
        (new global.Set([1]).size !== 1))
      global.Set = Set;

    function SetDataIndexOf(setData, key) {
      var i;
      if (key === key)
        return setData.indexOf(key);
      // Slow case for NaN
      for (i = 0; i < setData.length; i += 1)
        if (SameValueZero(setData[i], key)) return i;
      return -1;
    }

    // 23.2.1.2 new Set ( ...argumentsList )
    // 23.2.2 Properties of the Set Constructor

    // 23.2.2.1 Set.prototype
    var $SetPrototype$ =  {};
    Set.prototype = $SetPrototype$;

    // 23.2.2.2 get Set [ @@species ]
    // 23.2.3 Properties of the Set Prototype Object

    // 23.2.3.1 Set.prototype.add (value )
    define(
      Set.prototype, 'add',
      function add(value) {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        if (!('[[SetData]]' in s)) throw TypeError();
        if (s['[[SetData]]'] === undefined) throw TypeError();
        if (SameValue(value, -0)) value = 0;
        var entries = s['[[SetData]]'];
        var i = SetDataIndexOf(entries, value);
        if (i < 0) i = s['[[SetData]]'].length;
        s['[[SetData]]'][i] = value;

        return s;
      });

    // 23.2.3.2 Set.prototype.clear ()
    define(
      Set.prototype, 'clear',
      function clear() {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        if (!('[[SetData]]' in s)) throw TypeError();
        if (s['[[SetData]]'] === undefined) throw TypeError();
        var entries = s['[[SetData]]'];
        entries.length = 0;
        return undefined;
      });

    // 23.2.3.3 Set.prototype.constructor
    // 23.2.3.4 Set.prototype.delete ( value )
    define(
      Set.prototype, 'delete',
      function delete_(value) {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        if (!('[[SetData]]' in s)) throw TypeError();
        if (s['[[SetData]]'] === undefined) throw TypeError();
        var entries = s['[[SetData]]'];
        var i = SetDataIndexOf(entries, value);
        if (i < 0) return false;
        entries[i] = empty;
        return true;
      });

    // 23.2.3.5 Set.prototype.entries ( )
    define(
      Set.prototype, 'entries',
      function entries() {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        return CreateSetIterator(s, 'key+value');
      });

    // 23.2.3.6 Set.prototype.forEach ( callbackfn [ , thisArg ] )
    define(
      Set.prototype, 'forEach',
      function forEach(callbackfn/*, thisArg*/) {
        var thisArg = arguments[1];

        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        if (!('[[SetData]]' in s)) throw TypeError();
        if (s['[[SetData]]'] === undefined) throw TypeError();
        var entries = s['[[SetData]]'];

        if (!IsCallable(callbackfn)) {
          throw TypeError('First argument to forEach is not callable.');
        }
        for (var i = 0; i < entries.length; ++i) {
          if (entries[i] !== empty) {
            callbackfn.call(thisArg, entries[i], entries[i], s);
          }
        }
      });

    // 23.2.3.7 Set.prototype.has ( value )
    define(
      Set.prototype, 'has',
      function has(key) {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        if (!('[[SetData]]' in s)) throw TypeError();
        if (s['[[SetData]]'] === undefined) throw TypeError();
        var entries = s['[[SetData]]'];
        return SetDataIndexOf(entries, key) !== -1;
      });

    // 23.2.3.8 Set.prototype.keys ( )
    // See Set.prototype.values

    // 23.2.3.9 get Set.prototype.size
    Object.defineProperty(
      Set.prototype, 'size', {
        get: function() {
          var s = strict(this);
          if (Type(s) !== 'object') throw TypeError();
          if (!('[[SetData]]' in s)) throw TypeError();
          if (s['[[SetData]]'] === undefined) throw TypeError();
          var entries = s['[[SetData]]'];
          var count = 0;
          for (var i = 0; i < entries.length; ++i) {
            if (entries[i] !== empty)
              count = count + 1;
          }
          return count;
        }
      });

    // 23.2.3.10 Set.prototype.values ( )
    define(
      Set.prototype, 'values',
      function values() {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        return CreateSetIterator(s, 'value');
      });
    // NOTE: function name is still 'values':
    Set.prototype.keys = Set.prototype.values;

    // 23.2.3.11 Set.prototype [@@iterator ] ( )
    define(
      Set.prototype, $$iterator,
      function() {
        var s = strict(this);
        if (Type(s) !== 'object') throw TypeError();
        return CreateSetIterator(s);
      });

    // 23.2.3.12 Set.prototype [ @@toStringTag ]
    define(global.Set.prototype, $$toStringTag, 'Set');

    // 23.2.4 Properties of Set Instances
    // 23.2.5 Set Iterator Objects
    /** @constructor */
    function SetIterator() {}

    // 23.2.5.1 CreateSetIterator Abstract Operation
    function CreateSetIterator(set, kind) {
      if (Type(set) !== 'object') throw TypeError();
      if (!('[[SetData]]' in set)) throw TypeError();
      if (set['[[SetData]]'] === undefined) throw TypeError();
      var iterator = new SetIterator;
      set_internal(iterator, '[[IteratedSet]]', set);
      set_internal(iterator, '[[SetNextIndex]]', 0);
      set_internal(iterator, '[[SetIterationKind]]', kind);
      return iterator;
    }

    // 23.2.5.2 The %SetIteratorPrototype% Object
    var $SetIteratorPrototype$ = Object.create($IteratorPrototype$);
    SetIterator.prototype = $SetIteratorPrototype$;

    // 23.2.5.2.1 %SetIteratorPrototype%.next( )
    define(
      $SetIteratorPrototype$, 'next',
      function next() {
        var o = strict(this);
        if (Type(o) !== 'object') throw TypeError();
        var s = o['[[IteratedSet]]'],
            index = o['[[SetNextIndex]]'],
            itemKind = o['[[SetIterationKind]]'],
            entries = s['[[SetData]]'];
        while (index < entries.length) {
          var e = entries[index];
          index = index += 1;
          set_internal(o, '[[SetNextIndex]]', index);
          if (e !== empty) {
            if (itemKind === 'key+value')
              return CreateIterResultObject([e, e], false);
            return CreateIterResultObject(e, false);
          }
        }
        return CreateIterResultObject(undefined, true);
      });

    // 23.2.5.2.2 %SetIteratorPrototype% [ @@toStringTag ]
    define($SetIteratorPrototype$, $$toStringTag, 'Set Iterator');

    // 23.2.5.3 Properties of Set Iterator Instances

  }());

  // ---------------------------------------
  // 23.3 WeakMap Objects
  // ---------------------------------------

  (function() {
    // 23.3.1 The WeakMap Constructor
    // 23.3.1.1 WeakMap ( [ iterable ] )
    /** @constructor */
    function WeakMap(/*iterable*/) {
      var map = strict(this);
      var iterable = arguments[0];

      if (Type(map) !== 'object') throw TypeError();
      if ('[[WeakMapData]]' in map) throw TypeError();

      if (iterable !== undefined) {
        var adder = map['set'];
        if (!IsCallable(adder)) throw TypeError();
        var iter = GetIterator(ToObject(iterable));
      }
      set_internal(map, '[[WeakMapData]]', new EphemeronTable);
      if (iter === undefined) return map;
      while (true) {
        var next = IteratorStep(iter);
        if (next === false)
          return map;
        var nextValue = IteratorValue(next);
        if (Type(nextValue) !== 'object') throw TypeError();
        var k = nextValue[0];
        var v = nextValue[1];
        adder.call(map, k, v);
      }

      return map;
    }

    if (!('WeakMap' in global) || OVERRIDE_NATIVE_FOR_TESTING)
      global.WeakMap = WeakMap;

    // 23.3.2 Properties of the WeakMap Constructor
    // 23.3.2.1 WeakMap.prototype
    var $WeakMapPrototype$ = {};
    WeakMap.prototype = $WeakMapPrototype$;



   // 23.3.2.2 WeakMap[ @@create ] ( )
    // 23.3.3 Properties of the WeakMap Prototype Object

    // 23.3.3.1 WeakMap.prototype.constructor

    // 23.3.3.2 WeakMap.prototype.delete ( key )
    define(
      WeakMap.prototype, 'delete',
      function delete_(key) {
        var M = strict(this);
        if (Type(M) !== 'object') throw TypeError();
        if (M['[[WeakMapData]]'] === undefined) throw TypeError();
        if (Type(key) !== 'object') throw TypeError('Expected object');
        return M['[[WeakMapData]]'].remove(key);
      });

    // 23.3.3.3 WeakMap.prototype.get ( key )
    define(
      WeakMap.prototype, 'get',
      function get(key, defaultValue) {
        var M = strict(this);
        if (Type(M) !== 'object') throw TypeError();
        if (M['[[WeakMapData]]'] === undefined) throw TypeError();
        if (Type(key) !== 'object') throw TypeError('Expected object');
        return M['[[WeakMapData]]'].get(key, defaultValue);
      });

    // 23.3.3.4 WeakMap.prototype.has ( key )
    define(
      WeakMap.prototype, 'has',
      function has(key) {
        var M = strict(this);
        if (Type(M) !== 'object') throw TypeError();
        if (M['[[WeakMapData]]'] === undefined) throw TypeError();
        if (Type(key) !== 'object') throw TypeError('Expected object');
        return M['[[WeakMapData]]'].has(key);
      });

    // 23.3.3.5 WeakMap.prototype.set ( key , value )
    define(
      WeakMap.prototype, 'set',
      function set(key, value) {
        var M = strict(this);
        if (Type(M) !== 'object') throw TypeError();
        if (M['[[WeakMapData]]'] === undefined) throw TypeError();
        if (Type(key) !== 'object') throw TypeError('Expected object');
        M['[[WeakMapData]]'].set(key, value);
        return M;
      });

    // 23.3.3.6 WeakMap.prototype [ @@toStringTag ]
    define(global.WeakMap.prototype, $$toStringTag, 'WeakMap');

    // 23.3.4 Properties of WeakMap Instances

    // Polyfills for incomplete native implementations:
    (function() {
      var wm = new global.WeakMap();
      var orig = global.WeakMap.prototype.set;
      define(global.WeakMap.prototype, 'set', function set() {
        orig.apply(this, arguments);
        return this;
      }, wm.set({}, 0) !== wm);
    }());
  }());

  // ---------------------------------------
  // 23.4 WeakSet Objects
  // ---------------------------------------

  (function() {
    // 23.4.1 The WeakSet Constructor
    // 23.4.1.1 WeakSet ( [ iterable ] )
    /** @constructor */
    function WeakSet(/*iterable*/) {
      var set = strict(this);
      var iterable = arguments[0];

      if (Type(set) !== 'object') throw TypeError();
      if ('[[WeakSetData]]' in set) throw TypeError();

      if (iterable !== undefined) {
        var adder = set['add'];
        if (!IsCallable(adder)) throw TypeError();
        var iter = GetIterator(ToObject(iterable));
      }
      set_internal(set, '[[WeakSetData]]', new EphemeronTable);
      if (iter === undefined) return set;
      while (true) {
        var next = IteratorStep(iter);
        if (next === false)
          return set;
        var nextValue = IteratorValue(next);
        adder.call(set, nextValue);
      }

      return set;
    }

    if (!('WeakSet' in global) || OVERRIDE_NATIVE_FOR_TESTING)
      global.WeakSet = WeakSet;

    // 23.4.2 Properties of the WeakSet Constructor
    // 23.4.2.1 WeakSet.prototype
    var $WeakSetPrototype$ = {};
    WeakSet.prototype = $WeakSetPrototype$;

    // 23.4.3 Properties of the WeakSet Prototype Object
    // 23.4.3.1 WeakSet.prototype.add (value )
    define(
      WeakSet.prototype, 'add',
      function add(value) {
        var S = strict(this);
        if (Type(S) !== 'object') throw TypeError();
        if (S['[[WeakSetData]]'] === undefined) throw TypeError();
        if (Type(value) !== 'object') throw TypeError('Expected object');
        S['[[WeakSetData]]'].set(value, true);
        return S;
      });

    // 23.4.3.2 WeakSet.prototype.constructor
    // 23.4.3.3 WeakSet.prototype.delete ( value )
    define(
      WeakSet.prototype, 'delete',
      function delete_(value) {
        var S = strict(this);
        if (Type(S) !== 'object') throw TypeError();
        if (S['[[WeakSetData]]'] === undefined) throw TypeError();
        if (Type(value) !== 'object') throw TypeError('Expected object');
        return S['[[WeakSetData]]'].remove(value);
      });

    // 23.4.3.4 WeakSet.prototype.has ( value )
    define(
      WeakSet.prototype, 'has',
      function has(key) {
        var S = strict(this);
        if (Type(S) !== 'object') throw TypeError();
        if (S['[[WeakSetData]]'] === undefined) throw TypeError();
        if (Type(key) !== 'object') throw TypeError('Expected object');
        return S['[[WeakSetData]]'].has(key);
      });

    // 23.4.3.5 WeakSet.prototype [ @@toStringTag ]
    define(global.WeakSet.prototype, $$toStringTag, 'WeakSet');

    // 23.4.4 Properties of WeakSet Instances

    // Polyfills for incomplete native implementations:
    (function() {
      var ws = new global.WeakSet();
      var orig = global.WeakSet.prototype.add;
      define(global.WeakSet.prototype, 'add', function add() {
        orig.apply(this, arguments);
        return this;
      }, ws.add({}) !== ws);
    }());
  }());

  // ---------------------------------------
  // 24 Structured Data
  // ---------------------------------------

  // ---------------------------------------
  // 24.1 ArrayBuffer Objects
  // ---------------------------------------

  // See typedarray.js for TypedArray polyfill

  (function() {
    if (!('ArrayBuffer' in global))
      return;

    // 24.1.1 Abstract Operations For ArrayBuffer Objects
    // 24.1.1.1 AllocateArrayBuffer( constructor, byteLength )
    // 24.1.1.2 IsDetachedBuffer( arrayBuffer )
    // 24.1.1.3 DetachArrayBuffer( arrayBuffer )
    // 24.1.1.4 CloneArrayBuffer( srcBuffer, srcByteOffset [, cloneConstructor] )
    // 24.1.1.5 GetValueFromBuffer ( arrayBuffer, byteIndex, type, isLittleEndian )
    // 24.1.1.6 SetValueInBuffer ( arrayBuffer, byteIndex, type, value, isLittleEndian )
    // 24.1.2 The ArrayBuffer Constructor
    // 24.1.2.1 ArrayBuffer( length )
    // 24.1.3 Properties of the ArrayBuffer Constructor

    // 24.1.3.1 ArrayBuffer.isView ( arg )
    define(
      ArrayBuffer, 'isView',
      function isView(arg) {
        if (Type(arg) !== 'object') return false;
        if ('buffer' in arg && arg.buffer instanceof ArrayBuffer) return true;
        return false;
      });

    // 24.1.3.2 ArrayBuffer.prototype
    // 24.1.3.3 get ArrayBuffer [ @@species ]
    // 24.1.4 Properties of the ArrayBuffer Prototype Object
    // 24.1.4.1 get ArrayBuffer.prototype.byteLength
    // 24.1.4.2 ArrayBuffer.prototype.constructor
    // 24.1.4.3 ArrayBuffer.prototype.slice ( start , end)

    // 24.1.4.4 ArrayBuffer.prototype [ @@toStringTag ]
    define(ArrayBuffer.prototype, $$toStringTag, 'ArrayBuffer');

    // 24.1.5 Properties of the ArrayBuffer Instances
  }());

  // ---------------------------------------
  // 24.2 DataView Objects
  // ---------------------------------------

  // See typedarray.js for TypedArray polyfill

  (function() {
    if (!('DataView' in global))
      return;

    // 24.2.1 Abstract Operations For DataView Objects
    // 24.2.1.1 GetViewValue(view, requestIndex, isLittleEndian, type)
    // 24.2.1.2 SetViewValue(view, requestIndex, isLittleEndian, type, value)
    // 24.2.2 The DataView Constructor
    // 24.2.2.1 DataView (buffer [ , byteOffset [ , byteLength ] ] )
    // 24.2.3 Properties of the DataView Constructor
    // 24.2.3.1 DataView.prototype
    // 24.2.4 Properties of the DataView Prototype Object
    // 24.2.4.1 get DataView.prototype.buffer
    // 24.2.4.2 get DataView.prototype.byteLength
    // 24.2.4.3 get DataView.prototype.byteOffset
    // 24.2.4.4 DataView.prototype.constructor
    // 24.2.4.5 DataView.prototype.getFloat32 ( byteOffset [ , littleEndian ] )
    // 24.2.4.6 DataView.prototype.getFloat64 ( byteOffset [ , littleEndian ] )
    // 24.2.4.7 DataView.prototype.getInt8 ( byteOffset )
    // 24.2.4.8 DataView.prototype.getInt16 ( byteOffset [ , littleEndian ] )
    // 24.2.4.9 DataView.prototype.getInt32 ( byteOffset [ , littleEndian ] )
    // 24.2.4.10 DataView.prototype.getUint8 ( byteOffset )
    // 24.2.4.11 DataView.prototype.getUint16 ( byteOffset [ , littleEndian ] )
    // 24.2.4.12 DataView.prototype.getUint32 ( byteOffset [ , littleEndian ] )
    // 24.2.4.13 DataView.prototype.setFloat32 ( byteOffset, value [ , littleEndian ] )
    // 24.2.4.14 DataView.prototype.setFloat64 ( byteOffset, value [ , littleEndian ] )
    // 24.2.4.15 DataView.prototype.setInt8 ( byteOffset, value )
    // 24.2.4.16 DataView.prototype.setInt16 ( byteOffset, value [ , littleEndian ] )
    // 24.2.4.17 DataView.prototype.setInt32 ( byteOffset, value [ , littleEndian ] )
    // 24.2.4.18 DataView.prototype.setUint8 ( byteOffset, value )
    // 24.2.4.19 DataView.prototype.setUint16 ( byteOffset, value [ , littleEndian ] )
    // 24.2.4.20 DataView.prototype.setUint32 ( byteOffset, value [ , littleEndian ] )

    // 24.2.4.21 DataView.prototype[ @@toStringTag ]
    define(DataView.prototype, $$toStringTag, 'DataView');

    // 24.2.5 Properties of DataView Instances
  }());

  // ---------------------------------------
  // 24.3 The JSON Object
  // ---------------------------------------

  // 24.3.1 JSON.parse ( text [ , reviver ] )
  // 24.3.2 JSON.stringify ( value [ , replacer [ , space ] ] )
  // 24.3.3 JSON [ @@toStringTag ]
  define(JSON, $$toStringTag, 'JSON');

  // ---------------------------------------
  // 25.1 Iteration
  // ---------------------------------------

  // 25.1.1 Common Iteration Interfaces
  // 25.1.1.1 The Iterable Interface
  // 25.1.1.2 The Iterator Interface
  // 25.1.1.3 The IteratorResult Interface

  // 25.1.2 The %IteratorPrototype% Object
  // Defined earlier, so other prototypes can reference it.
  // 25.1.2.1 %IteratorPrototype% [ @@iterator ] ( )
  define($IteratorPrototype$, $$iterator, function() {
    return this;
  });


  // ---------------------------------------
  // 25.4 Promise Objects
  // ---------------------------------------

  (function() {
    // 25.4 Promise Objects

    // 25.4.1 Promise Abstract Operations

    // 25.4.1.1 PromiseCapability Records
    // 25.4.1.1.1 IfAbruptRejectPromise ( value, capability )

    function IfAbruptRejectPromise(value, capability) {
      var rejectResult = capability['[[Reject]]'].call(undefined, value);
      return capability['[[Promise]]'];
    }

    // 25.4.1.2 PromiseReaction Records

    // 25.4.1.3 CreateResolvingFunctions ( promise )

    function CreateResolvingFunctions(promise) {
      var alreadyResolved = {'[[value]]': false};
      var resolve = PromiseResolveFunction();
      set_internal(resolve, '[[Promise]]',  promise);
      set_internal(resolve, '[[AlreadyResolved]]', alreadyResolved);
      var reject = PromiseRejectFunction();
      set_internal(reject, '[[Promise]]', promise);
      set_internal(reject, '[[AlreadyResolved]]', alreadyResolved);
      return { '[[Resolve]]': resolve, '[[Reject]]': reject};
    }

    // 25.4.1.3.1 Promise Reject Functions

    function PromiseRejectFunction() {
      var F = function(reason) {
        console.assert(Type(F['[[Promise]]']) === 'object');
        var promise = F['[[Promise]]'];
        var alreadyResolved = F['[[AlreadyResolved]]'];
        if (alreadyResolved['[[value]]']) return undefined;
        set_internal(alreadyResolved, '[[value]]', true);
        return RejectPromise(promise, reason);
      };
      return F;
    }

    // 25.4.1.3.2 Promise Resolve Functions

    function PromiseResolveFunction() {
      var F = function(resolution) {
        console.assert(Type(F['[[Promise]]']) === 'object');
        var promise = F['[[Promise]]'];
        var alreadyResolved = F['[[AlreadyResolved]]'];
        if (alreadyResolved['[[value]]']) return undefined;
        set_internal(alreadyResolved, '[[value]]', true);

        if (SameValue(resolution, promise))  {
          var selfResolutionError = TypeError();
          return RejectPromise(promise, selfResolutionError);
        }
        if (Type(resolution) !== 'object')
          return FulfillPromise(promise, resolution);
        try {
          var then = resolution['then'];
        } catch(then) {
          return RejectPromise(promise, then);
        }
        if (!IsCallable(then))
          return FulfillPromise(promise, resolution);
        EnqueueJob('PromiseJobs', PromiseResolveThenableJob, [promise, resolution, then]);
        return undefined;
      };
      return F;
    }

    // 25.4.1.4 FulfillPromise ( promise, value )

    function FulfillPromise(promise, value) {
      console.assert(promise['[[PromiseState]]'] === 'pending');
      var reactions = promise['[[PromiseFulfillReactions]]'];
      set_internal(promise, '[[PromiseResult]]', value);
      set_internal(promise, '[[PromiseFulfillReactions]]', undefined);
      set_internal(promise, '[[PromiseRejectReactions]]', undefined);
      set_internal(promise, '[[PromiseState]]', 'fulfilled');
      return TriggerPromiseReactions(reactions, value);
    }

    // 25.4.1.5 NewPromiseCapability ( C )

    function NewPromiseCapability(c) {
      // To keep Promise hermetic, this doesn't look much like the spec.
      return CreatePromiseCapabilityRecord(undefined, c);
    }

    // 25.4.1.5.1 CreatePromiseCapabilityRecord ( promise, constructor )

    function CreatePromiseCapabilityRecord(promise, constructor) {
      // To keep Promise hermetic, this doesn't look much like the spec.
      console.assert(IsConstructor(constructor));
      var promiseCapability = {};
      set_internal(promiseCapability, '[[Promise]]', promise);
      set_internal(promiseCapability, '[[Resolve]]', undefined);
      set_internal(promiseCapability, '[[Reject]]', undefined);
      var executor = GetCapabilitiesExecutor();
      set_internal(executor, '[[Capability]]', promiseCapability);

      // NOTE: Differs from spec; object is constructed here
      var constructorResult = promise = new constructor(executor);
      set_internal(promiseCapability, '[[Promise]]', promise);

      if (!IsCallable(promiseCapability['[[Resolve]]'])) throw TypeError();
      if (!IsCallable(promiseCapability['[[Reject]]'])) throw TypeError();
      if (Type(constructorResult) === 'object' && !SameValue(promise, constructorResult)) throw TypeError();
      return promiseCapability;
    }

    // 25.4.1.5.2 GetCapabilitiesExecutor Functions

    function GetCapabilitiesExecutor() {
      var F = function(resolve, reject) {
        console.assert(F['[[Capability]]']);
        var promiseCapability = F['[[Capability]]'];
        if (promiseCapability['[[Resolve]]'] !== undefined) throw TypeError();
        if (promiseCapability['[[Reject]]'] !== undefined) throw TypeError();
        set_internal(promiseCapability, '[[Resolve]]', resolve);
        set_internal(promiseCapability, '[[Reject]]', reject);
        return undefined;
      };
      return F;
    }

    // 25.4.1.6 IsPromise ( x )

    function IsPromise(x) {
      if (Type(x) !== 'object') return false;
      if (!('[[PromiseState]]' in x)) return false;
      if (x['[[PromiseState]]'] === undefined) return false;
      return true;
    }

    // 25.4.1.7 RejectPromise ( promise, reason )

    function RejectPromise(promise, reason) {
      console.assert(promise['[[PromiseState]]'] === 'pending');
      var reactions = promise['[[PromiseRejectReactions]]'];
      set_internal(promise, '[[PromiseResult]]', reason);
      set_internal(promise, '[[PromiseFulfillReactions]]', undefined);
      set_internal(promise, '[[PromiseRejectReactions]]', undefined);
      set_internal(promise, '[[PromiseState]]', 'rejected');
      return TriggerPromiseReactions(reactions, reason);
    }

    // 25.4.1.8 TriggerPromiseReactions ( reactions, argument )

    function TriggerPromiseReactions(reactions, argument) {
      for (var i = 0, len = reactions.length; i < len; ++i)
        EnqueueJob('PromiseJobs', PromiseReactionJob, [reactions[i], argument]);
      return undefined;
    }

    // 25.4.2 Promise Jobs

    // 25.4.2.1 PromiseReactionJob ( reaction, argument )

    function PromiseReactionJob(reaction, argument) {
      var promiseCapability = reaction['[[Capabilities]]'];
      var handler = reaction['[[Handler]]'];
      var handlerResult, status;
      try {
        if (handler === 'Identity') handlerResult = argument;
        else if (handler === 'Thrower') throw argument;
        else handlerResult = handler.call(undefined, argument);
      } catch (handlerResult) {
        status = promiseCapability['[[Reject]]'].call(undefined, handlerResult);
        NextJob(status); return;
      }
      status = promiseCapability['[[Resolve]]'].call(undefined, handlerResult);
      NextJob(status);
    }

    // 25.4.2.2 PromiseResolveThenableJob ( promiseToResolve, thenable, then)

    function PromiseResolveThenableJob(promiseToResolve, thenable, then) {
      // SPEC BUG: promise vs. promiseToResolve
      var resolvingFunctions = CreateResolvingFunctions(promiseToResolve);
      try {
        var thenCallResult = then.call(thenable, resolvingFunctions['[[Resolve]]'],
                                       resolvingFunctions['[[Reject]]']);
      } catch (thenCallResult) {
        var status = resolvingFunctions['[[Reject]]'].call(undefined, thenCallResult);
        NextJob(status); return;
      }
      NextJob(thenCallResult);
    }

    // 25.4.3 The Promise Constructor

    // 25.4.3.1 Promise ( executor )

    function Promise(executor) {
      var config = { configurable: false, enumerable: false, writable: true, value: undefined };
      Object.defineProperty(this, '[[PromiseState]]', config);
      Object.defineProperty(this, '[[PromiseConstructor]]', config);
      Object.defineProperty(this, '[[PromiseResult]]', config);
      Object.defineProperty(this, '[[PromiseFulfillReactions]]', config);
      Object.defineProperty(this, '[[PromiseRejectReactions]]', config);

      var promise = this;
      if (Type(promise) !== 'object') throw new TypeError();
      if (!('[[PromiseState]]' in promise)) throw TypeError();
      if (promise['[[PromiseState]]'] !== undefined) throw TypeError();
      if (!IsCallable(executor)) throw TypeError();

      set_internal(promise, '[[PromiseConstructor]]', Promise);

      return InitializePromise(promise, executor);
    }

    // 25.4.3.1.1 InitializePromise ( promise, executor )

    function InitializePromise(promise, executor) {
      console.assert('[[PromiseState]]' in promise);
      console.assert(IsCallable(executor));
      set_internal(promise, '[[PromiseState]]', 'pending');
      set_internal(promise, '[[PromiseFulfillReactions]]', []);
      set_internal(promise, '[[PromiseRejectReactions]]', []);
      var resolvingFunctions = CreateResolvingFunctions(promise);
      try {
        var completion = executor.call(undefined, resolvingFunctions['[[Resolve]]'],
                                       resolvingFunctions['[[Reject]]']);
      } catch (completion) {
        var status = resolvingFunctions['[[Reject]]'].call(undefined, completion);
      }
      return promise;
    }

    // 25.4.4 Properties of the Promise Constructor
    // 25.4.4.1 Promise.all ( iterable )

    define(Promise, 'all', function all(iterable) {
      var c = strict(this);
      var promiseCapability = NewPromiseCapability(c);
      try {
        var iterator = GetIterator(iterable);
      } catch (value) {
        promiseCapability['[[Reject]]'].call(undefined, value);
        return promiseCapability['[[Promise]]'];
      }
      var values = [];
      var remainingElementsCount = { value: 1 };
      var index = 0;
      while (true) {
        try {
          var next = IteratorStep(iterator);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        if (!next) {
          remainingElementsCount.value -= 1;
          if (remainingElementsCount.value === 0) {
            var resolveResult = promiseCapability['[[Resolve]]'].apply(undefined, values);


          }
          return promiseCapability['[[Promise]]'];
        }
        try {
          var nextValue = IteratorValue(next);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        try {
          var nextPromise = c.resolve(nextValue);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        var resolveElement = PromiseAllResolveElementFunction();
        set_internal(resolveElement, '[[AlreadyCalled]]', { value: false });
        set_internal(resolveElement, '[[Index]]', index);
        set_internal(resolveElement, '[[Values]]', values);
        set_internal(resolveElement, '[[Capabilities]]', promiseCapability);
        set_internal(resolveElement, '[[RemainingElements]]', remainingElementsCount);
        remainingElementsCount.value += 1;
        try {
          var result = nextPromise.then(resolveElement, promiseCapability['[[Reject]]']);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        index += 1;
      }
    });

    // 25.4.4.1.1 Promise.all Resolve Element Functions

    function PromiseAllResolveElementFunction() {
      var F = function(x) {
        var alreadyCalled = F['[[AlreadyCalled]]'];
        if (alreadyCalled.value) return undefined;
        alreadyCalled.value = true;
        var index = F['[[Index]]'];
        var values = F['[[Values]]'];
        var promiseCapability = F['[[Capabilities]]'];
        var remainingElementsCount = F['[[RemainingElements]]'];
        try {
          values[index] = x;
        } catch (result) {
          promiseCapability['[[Reject]]'].call(undefined, result);
          return promiseCapability['[[Promise]]'];
        }
        remainingElementsCount.value -= 1;
        if (remainingElementsCount.value === 0)
          return promiseCapability['[[Resolve]]'].call(undefined, values);
        return undefined;
      };
      return F;
    }

    // 25.4.4.2 Promise.prototype

    Promise.prototype = {};

    // 25.4.4.3 Promise.race ( iterable )

    define(Promise, 'race', function race(iterable) {
      var c = strict(this);
      var promiseCapability = NewPromiseCapability(c);
      try {
        var iterator = GetIterator(iterable);
      } catch (value) {
        promiseCapability['[[Reject]]'].call(undefined, value);
        return promiseCapability['[[Promise]]'];
      }
      while (true) {
        try {
          var next = IteratorStep(iterator);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        if (!next) return promiseCapability['[[Promise]]'];
        try {
          var nextValue = IteratorValue(next);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        try {
          var nextPromise = c.resolve(nextValue);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
        try {
          nextPromise.then(promiseCapability['[[Resolve]]'], promiseCapability['[[Reject]]']);
        } catch (value) {
          promiseCapability['[[Reject]]'].call(undefined, value);
          return promiseCapability['[[Promise]]'];
        }
      }
    });

    // 25.4.4.4 Promise.reject ( r )

    define(Promise, 'reject', function reject(r) {
      var c = strict(this);
      var promiseCapability = NewPromiseCapability(c);
      var rejectResult = promiseCapability['[[Reject]]'].call(undefined, r);
      return promiseCapability['[[Promise]]'];
    });

    // 25.4.4.5 Promise.resolve ( x )

    define(Promise, 'resolve', function resolve(x) {
      var c = strict(this);
      if (IsPromise(x)) {
        var constructor = x['[[PromiseConstructor]]'];
        if (SameValue(constructor, c)) return x;
      }
      var promiseCapability = NewPromiseCapability(c);
      var resolveResult = promiseCapability['[[Resolve]]'].call(undefined, x);
      return promiseCapability['[[Promise]]'];
    });

    // 25.4.4.6 Promise [ @@create ] ( )
    // 25.4.4.6.1 AllocatePromise ( constructor )
    // 25.4.5 Properties of the Promise Prototype Object
    // 25.4.5.1 Promise.prototype.catch ( onRejected )

    define(Promise.prototype, 'catch', function catch_(onRejected) {
      var promise = this;
      return promise.then(undefined, onRejected);
    });

    // 25.4.5.2 Promise.prototype.constructor

    Promise.prototype.constructor = Promise;

    // 25.4.5.3 Promise.prototype.then ( onFulfilled , onRejected )

    define(Promise.prototype, 'then', function then(onFulfilled, onRejected) {
      var promise = this;
      if (!IsPromise(promise)) throw TypeError();
      if (!IsCallable(onFulfilled)) onFulfilled = 'Identity';
      if (!IsCallable(onRejected)) onRejected = 'Thrower';
      var c = promise.constructor;
      var promiseCapability = NewPromiseCapability(c);
      var fulfillReaction = { '[[Capabilities]]': promiseCapability,
                              '[[Handler]]': onFulfilled };
      var rejectReaction = { '[[Capabilities]]': promiseCapability,
                             '[[Handler]]': onRejected };
      if (promise['[[PromiseState]]'] === 'pending') {
        promise['[[PromiseFulfillReactions]]'].push(fulfillReaction);
        promise['[[PromiseRejectReactions]]'].push(rejectReaction);
      } else if (promise['[[PromiseState]]'] === 'fulfilled') {
        var value = promise['[[PromiseResult]]'];
        EnqueueJob('PromiseJobs', PromiseReactionJob, [fulfillReaction, value]);
      } else if (promise['[[PromiseState]]'] === 'rejected') {
        var reason = promise['[[PromiseResult]]'];
        EnqueueJob('PromiseJobs', PromiseReactionJob, [rejectReaction, reason]);
      }
      return promiseCapability['[[Promise]]'];
    });

    // 25.4.6 Properties of Promise Instances

    if (!('Promise' in global) || OVERRIDE_NATIVE_FOR_TESTING)
      global.Promise = Promise;

    // Patch early Promise.cast vs. Promise.resolve implementations
    if ('cast' in global.Promise) global.Promise.resolve = global.Promise.cast;
  }());

  // 25.4.5.1 Promise.prototype [ @@toStringTag ]
  define(Promise.prototype, $$toStringTag, 'Promise');

  // ---------------------------------------
  // 26 Reflection
  // ---------------------------------------

  (function() {
    // 26.1 The Reflect Object
    if (!('Reflect' in global) || OVERRIDE_NATIVE_FOR_TESTING)
      global.Reflect = {};

    // 26.1.1 Reflect.apply ( target, thisArgument, argumentsList )
    define(
      Reflect, 'apply',
      function apply(target, thisArgument, argumentsList) {
        if (!IsCallable(target)) throw TypeError();
        return Function.prototype.apply.call(target, thisArgument, argumentsList);
      });

    // 26.1.2 Reflect.construct ( target, argumentsList [, newTarget] )
    define(
      Reflect, 'construct',
      function construct(target, argumentsList) {
        return __cons(target, argumentsList);
      });

    // 26.1.3 Reflect.defineProperty ( target, propertyKey, attributes )
    define(
      Reflect, 'defineProperty',
      function defineProperty(target, propertyKey, attributes) {
        try {
          Object.defineProperty(target, propertyKey, attributes);
          return true;
        } catch (_) {
          return false;
        }
      });

    // 26.1.4 Reflect.deleteProperty ( target, propertyKey )
    define(
      Reflect, 'deleteProperty',
      function deleteProperty(target,name) {
        try {
          delete target[name];
          return !HasOwnProperty(target, name);
        } catch (_) {
          return false;
        }
      });

    // 26.1.5 Reflect.enumerate ( target )
    define(
      Reflect, 'enumerate',
      function enumerate(target) {
        target = ToObject(target);
        var iterator = Enumerate(target);
        return iterator;
      });

    // 26.1.6 Reflect.get ( target, propertyKey [ , receiver ])
    define(
      Reflect, 'get',
      function get(target, name, receiver) {
        target = ToObject(target);
        name = String(name);
        receiver = (receiver === undefined) ? target : ToObject(receiver);
        var desc = getPropertyDescriptor(target, name);
        if (desc && 'get' in desc)
          return Function.prototype.call.call(desc['get'], receiver);
        return target[name];
      });

    // 26.1.7 Reflect.getOwnPropertyDescriptor ( target, propertyKey )
    define(
      Reflect, 'getOwnPropertyDescriptor',
      Object.getOwnPropertyDescriptor);

    // 26.1.8 Reflect.getPrototypeOf ( target )
    define(
      Reflect, 'getPrototypeOf',
      Object.getPrototypeOf);

    // 26.1.9 Reflect.has ( target, propertyKey )
    define(
      Reflect, 'has',
      function has(target,name) {
        return String(name) in ToObject(target);
      });

    // 26.1.10 Reflect.isExtensible (target)
    define(
      Reflect, 'isExtensible',
      Object.isExtensible);

    // 26.1.11 Reflect.ownKeys ( target )
    define(
      Reflect, 'ownKeys',
      function ownKeys(target) {
        var obj = ToObject(target);
        return Object.getOwnPropertyNames(obj);
      });

    // 26.1.12 Reflect.preventExtensions ( target )
    define(
      Reflect, 'preventExtensions',
      function preventExtensions(target) {
        try { Object.preventExtensions(target); return true; } catch (_) { return false; }
      });

    // 26.1.13 Reflect.set ( target, propertyKey, V [ , receiver ] )
    define(
      Reflect, 'set',
      function set(target, name, value, receiver) {
        target = ToObject(target);
        name = String(name);
        receiver = (receiver === undefined) ? target : ToObject(receiver);
        var desc = getPropertyDescriptor(target, name);
        try {
          if (desc && 'set' in desc)
            Function.prototype.call.call(desc['set'], receiver, value);
          else
            target[name] = value;
          return true;
        } catch (_) {
          return false;
        }
      });

    // 26.1.14 Reflect.setPrototypeOf ( target, proto )
    define(
      Reflect, 'setPrototypeOf',
      function setPrototypeOf(target, proto) {
        try {
          target.__proto__ = proto;
          return Reflect.getPrototypeOf(target) === proto;
        } catch(_) {
          return false;
        }
      });

  }());

  // ---------------------------------------
  // 26.2 Proxy Objects
  // ---------------------------------------

  // Not polyfillable.

}(self));

// This helper is defined outside the main scope so that the use of
// 'eval' does not taint the scope for minifiers.
function __cons(t, a) {
  return eval('new t(' + a.map(function(_, i) { return 'a[' + i + ']'; }).join(',') + ')');
}
