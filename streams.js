/**
  * Copyright (c) 2011 Ivan Vladimirov Ivanov (ivan.vladimirov.ivanov@gmail.com)
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to
  * deal in the Software without restriction, including without limitation
  * the rights to use, copy, modify, merge, publish, distribute, sublicense,
  * and/or sell copies of the Software, and to permit persons to whom the
  * Software is furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included
  * in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
  * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
  * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
  * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  * OTHER DEALINGS IN THE SOFTWARE.
  *
  *
  *
  * A library for lazy lists - streams.
  *
  * @author Ivan Vladimirov Ivanov (ivan.vladimirov.ivanov@gmail.com)
  */

var streams = {};

streams.Stream = function(car, delayedCdr) {
  this.car = car;
  this.delayedCdr = delayedCdr;
  this.isCdrComputed = false;
};

streams.EMPTY_STREAM = new streams.Stream('empty stream', 'empty stream');

streams.Stream.prototype = {
  streamCar: function() {
    return this.car;
  },

  streamCdr: function() {
    if (this.isCdrComputed) return this.cdr;
    this.cdr = this.delayedCdr();
    this.isCdrComputed = true;
    return this.cdr;
  },

  isEmpty: function() {
    return (this.car === 'empty stream' && this.delayedCdr === 'empty stream');
  },

  forEach: function(func) {
    current = this;
    while (!current.isEmpty()) {
      func(current.streamCar());
      current = current.streamCdr();
    }
  },

  map: function(func) {
    var that = this;
    if (this.isEmpty()) return streams.EMPTY_STREAM;
    return new streams.Stream(
        func(this.streamCar()),
        function() { return that.streamCdr().map(func); });
  },

  filter: function(pred) {
    var that = this;
    if (this.isEmpty()) return streams.EMPTY_STREAM;
    if (pred(this.streamCar())) {
      return new streams.Stream(
          this.streamCar(),
          function() { return that.streamCdr().filter(pred); });
    }
    return this.streamCdr().filter(pred);
  },

  reduce: function(func, initialValue) {
    var result = initialValue;
    var current = this;
    while (!current.isEmpty()) {
      result = func(result, current.streamCar());
      current = current.streamCdr();
    }
    return result;
  },

  interleave: function(s) {
    var that = this;
    if (this.isEmpty()) return s;
    return new streams.Stream(
        this.streamCar(),
        function() { return s.interleave(that.streamCdr()); });
  },

  merge: function(s) {
    var car1;
    var car2;
    var that = this;

    if (s.isEmpty()) return this;
    if (this.isEmpty()) return s;

    car1 = this.streamCar();
    car2 = s.streamCar();
    if (car1 < car2) {
      return new streams.Stream(
          car1,
          function() { return that.streamCdr().merge(s); });
    }
    if (car1 > car2) {
      return new streams.Stream(
          car2,
          function() { return that.merge(s.streamCdr()); });
    }

    return new streams.Stream(
        car1,
        function() { return that.streamCdr().merge(s.streamCdr()); });
  },

  scale: function(scalar) {
    return this.map(function(num) { return scalar * num; });
  },

  take: function(n) {
    var that = this;
    if (n === 0) return streams.EMPTY_STREAM;
    if (this.isEmpty()) return streams.EMPTY_STREAM;
    if (n === 1) return streams.singletonStream(this.streamCar());
    return new streams.Stream(
        this.streamCar(),
        function() { return that.streamCdr().take(n - 1); });
  },

  append: function(s) {
    var that = this;
    if (this.isEmpty()) return s;
    return new streams.Stream(
        this.streamCar(),
        function() { return that.streamCdr().append(s); });
  },

  appendDelayed: function(s) {
    var that = this;
    if (this.isEmpty()) return s();
    return new streams.Stream(
        this.streamCar(),
        function() { return that.streamCdr().appendDelayed(s); });
  },

  interleaveDelayed: function(s) {
    var that = this;
    if (this.isEmpty()) return s();
    return new streams.Stream(
        this.streamCar(),
        function() {
          return s().interleaveDelayed(function() {
            return that.streamCdr();
          });
        });
  },

  flattenDelayed: function() {
    var that = this;
    if (this.isEmpty()) return streams.EMPTY_STREAM;
    return this.streamCar().interleaveDelayed(
        function() { return that.streamCdr().flattenDelayed(); });
  },

  flatmapDelayed: function(func) {
    return this.map(func).flattenDelayed();
  }
};

streams.EMPTY_STREAM = new streams.Stream('empty stream', 'empty stream');

streams.singletonStream = function(value) {
  return new streams.Stream(
      value, function() { return streams.EMPTY_STREAM; });
};

streams.range = function(a, b) {
  if (a > b) return streams.EMPTY_STREAM;
  return new streams.Stream(a, function() { return streams.range(a + 1, b); });
};

