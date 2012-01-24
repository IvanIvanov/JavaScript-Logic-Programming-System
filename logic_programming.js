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
  * This library is a JavaScript adaptation of the logic programming system
  * from the book "Structure and Interpretation of Computer Programs",
  * Section 4.4: http://mitpress.mit.edu/sicp/full-text/book/book.html
  *
  * @author Ivan Vladimirov Ivanov (ivan.vladimirov.ivanov@gmail.com)
  */

var lP = {};

//#############################################################################
// Definitions of primary datastructures:
//   * Frame     - a linked-list like data structure of name-value pairs.
//   * Assertion - models an assertion/fact in the database.
//   * Rule      - models a rule in the database.
//   * Database  - a collections of assertions and rules.
//#############################################################################

lP.Frame = function(name, value, frame) {
  this.name = name;
  this.value = value;
  this.frame = frame;
};

lP.Frame.prototype = {
  lookup: function(name) {
    if (name === this.name) return this.value;
    if (this.frame) return this.frame.lookup(name);
    return false;
  },

  toString: function() {
    var result = '';
    var currentFrame = this;

    while (currentFrame) {
      result += (currentFrame.name + ': ' +
          lP.serializeTree(currentFrame.value) + '; ');
      currentFrame = currentFrame.frame;
    }
    return result;
  }
};

lP.EMPTY_FRAME = new lP.Frame('', '', false);

lP.Assertion = function(assertion) {
  this.assertion = assertion;
};

lP.Assertion.prototype = {
  checkAssertion: function(pattern, frame) {
    var matchResult = lP.patternMatch(pattern, this.assertion, frame);
    if (matchResult) return streams.singletonStream(matchResult);
    return streams.EMPTY_STREAM;
  },

  toString: function() {
    return 'assertion: ' + lP.serializeTree(this.assertion);
  }
};

lP.Rule = function(conclusion, body) {
  this.conclusion = conclusion;
  this.body = body;
};

lP.Rule.idCount = 0;

lP.Rule.prototype = {
  renameVariables: function() {
    lP.Rule.idCount++;
    return new lP.Rule(
        lP.renameVariables(this.conclusion, lP.Rule.idCount),
        lP.renameVariables(this.body, lP.Rule.idCount));
  },

  applyRule: function(db, pattern, frame) {
    var cleanRule = this.renameVariables();
    var match = lP.unifyMatch(pattern, cleanRule.conclusion, frame);
    if (match) return lP.qeval(
        db, cleanRule.body, streams.singletonStream(match));
    return streams.EMPTY_STREAM;
  },

  toString: function() {
    return ('rule: ' + lP.serializeTree(this.conclusion) +
        ' <- ' + lP.serializeTree(this.body));
  }
};

lP.Database = function() {
  this.assertions = streams.EMPTY_STREAM;
  this.rules = streams.EMPTY_STREAM;
};

lP.Database.prototype = {
  addAssertion: function(assertion) {
    var oldAssertions = this.assertions;
    this.assertions = this.assertions.append(
        streams.singletonStream(assertion));
  },

  addRule: function(rule) {
    var oldRules = this.rules;
    this.rules = this.rules.append(streams.singletonStream(rule));
  },

  fetchAssertions: function(pattern, frame) {
    //TODO: optimize
    return this.assertions;
  },

  fetchRules: function(pattern, frame) {
    //TODO: optimize
    return this.rules;
  },

  findAssertions: function(pattern, frame) {
    return this.fetchAssertions(pattern, frame).flatmapDelayed(
        function(a) { return a.checkAssertion(pattern, frame); });
  },

  applyRules: function(pattern, frame) {
    var that = this;
    return this.fetchRules(pattern, frame).flatmapDelayed(
        function(r) { return r.applyRule(that, pattern, frame); });
  },

  toString: function() {
    return (
        'Assertions: \n' +
        this.assertions.reduce(
            function(result, a) { return result + a + '\n'; },
            '') +
        'Rules: \n' +
        this.rules.reduce(
            function(result, r) { return result + r + '\n'; },
            ''));
  }
};

lP.renameVariables = function(tree, id) {
  if (lP.isVariable(tree)) return tree + '-' + id;
  if (lP.isArray(tree)) {
    return lP.map(function(x) { return lP.renameVariables(x, id); }, tree);
  }
  return tree;
};

//#############################################################################
// Pattern matching and unification
// --------------------------------
//
// Both pattern matching and unification are applied to heterogeneous
// JavaScript arrays, which contain a mix of strings and other heterogeneous
// arrays. If a string begins with a '?' then it represents a variable,
// otherwise it represents an atom. Example patterns include:
// 
//   1) ['foo', '?x']
//   2) ['foo', ['bar', 'baz']]
//   3) ['?y',  ['bar', 'baz']]
// 
// The idea of pattern matching and unification is to find appropriate
// bindings for variables so as to equate two patterns. Pattern matching
// is simpler since only one of its input patterns may contain variables.
// Unification, on the other hand, allows both patterns to contain variables.
// 
// Pattern matching is implemented by the function 'lP.patternMatch' which
// takes two patterns ('pattern' and 'data'), where only the first one may
// contain variables, and a frame of (variable, pattern) bindings and returns
// a new frame with the extra bindings needed to equate the two patterns or
// 'false' if equating is impossible. For example if we pattern match the
// first two examples with an empty frame we would get the new binding:
// 
//   '?x' = ['bar', 'baz']
// 
// Unification is implemented by the function 'lP.unifyMatch' which
// takes two patterns ('pattern1' and 'pattern2'), where both may contain
// variables, and a frame of (variable, pattern) bindings and returns a new
// frame with the extra bindings needed to equate the two patterns or 'false'
// if equating is impossible. For example if we pattern match the first and
// the last examples with an empty frame we would get the new bindings:
// 
//   '?x': ['bar', 'baz']
//   '?y': 'foo'

//#############################################################################

lP.extendIfConsistent = function(variable, data, frame) {
  var value = frame.lookup(variable);
  if (value) return lP.patternMatch(value, data, frame);
  return new lP.Frame(variable, data, frame);
};

lP.patternMatch = function(pattern, data, frame) {
  var i;

  if (frame === false) return false;
  if (pattern === data) return frame;
  if (lP.isVariable(pattern)) {
    return lP.extendIfConsistent(pattern, data, frame);
  }
  if (lP.isArray(pattern) && lP.isArray(data)) {
    if (pattern.length !== data.length) return false;
    for (i = 0; i < pattern.length; i++) {
      frame = lP.patternMatch(pattern[i], data[i], frame);
    }
    return frame;
  }
  return false;
};

lP.dependsOn = function(tree, variable, frame) {
  var i;
  var frameValue;

  if (lP.isVariable(tree)) {
    if (tree === variable) return true;
    frameValue = frame.lookup(tree);
    if (frameValue) return lP.dependsOn(frameValue, variable, frame);
    return false;
  }
  if (lP.isArray(tree)) {
    for (i = 0; i < tree.length; i++) {
      if (lP.dependsOn(tree[i], variable, frame)) return true;
    }
  }
  return false;
};

lP.extendIfPossible = function(variable, value, frame) {
  var frameValue1 = frame.lookup(variable);
  var frameValue2;

  if (frameValue1) return lP.unifyMatch(frameValue1, value, frame);
  if (lP.isVariable(value)) {
    frameValue2 = frame.lookup(value);
    if (frameValue2) return lP.unifyMatch(frameValue2, variable, frame);
    return new lP.Frame(variable, value, frame);
  }
  if (lP.dependsOn(value, variable, frame)) return false;
  return new lP.Frame(variable, value, frame);
};

lP.unifyMatch = function(pattern1, pattern2, frame) {
  var i;

  if (frame === false) return false;
  if (pattern1 === pattern2) return frame;
  if (lP.isVariable(pattern1)) {
    return lP.extendIfPossible(pattern1, pattern2, frame);
  }
  if (lP.isVariable(pattern2)) {
    return lP.extendIfPossible(pattern2, pattern1, frame);
  }
  if (lP.isArray(pattern1) && lP.isArray(pattern2)) {
    if (pattern1.length !== pattern2.length) return false;
    for (i = 0; i < pattern1.length; i++) {
      frame = lP.unifyMatch(pattern1[i], pattern2[i], frame);
    }
    return frame;
  }
  return false;
};

lP.instantiate = function(pattern, frame) {
  var value;

  if (lP.isVariable(pattern)) {
    value = frame.lookup(pattern);
    if (value) return lP.instantiate(value, frame);
    return pattern;
  }
  if (lP.isArray(pattern)) {
    return lP.map(function(x) { return lP.instantiate(x, frame); }, pattern);
  }
  return pattern;
};

//#############################################################################
// Evaluation of queries - logic inference
//#############################################################################

lP.qeval = function(db, pattern, frameStream) {
  if (lP.isAnd(pattern)) return lP.andQuery(db, pattern, frameStream);
  if (lP.isOr(pattern)) return lP.orQuery(db, pattern, frameStream);
  if (lP.isNot(pattern)) return lP.notQuery(db, pattern, frameStream);
  return lP.simpleQuery(db, pattern, frameStream);
};

lP.simpleQuery = function(db, pattern, frameStream) {
  return frameStream.flatmapDelayed(
      function(frame) {
        return db.findAssertions(pattern, frame).appendDelayed(
            function() { return db.applyRules(pattern, frame); });
      });
};

lP.andQuery = function(db, pattern, frameStream) {
  var i;
  var result = frameStream;
  for (i = 1; i < pattern.length; i++) {
    result = lP.qeval(db, pattern[i], result);
  }
  return result;
};

lP.orQuery = function(db, pattern, frameStream) {
  var i;
  var result = streams.EMPTY_STREAM;
  for (i = 1; i < pattern.length; i++) {
    result = result.interleaveDelayed(
        function() { return lP.qeval(db, pattern[i], frameStream); });
  }
  return result;
};

lP.notQuery = function(db, pattern, frameStream) {
  return frameStream.flatmapDelayed(
      function(frame) {
        var result = lP.qeval(db, pattern[1], streams.singletonStream(frame));
        if (result.isEmpty()) return streams.singletonStream(frame);
        return streams.EMPTY_STREAM;
      });
};

//#############################################################################
// Serialization logic
//#############################################################################

lP.serializeTree = function(tree) {
  if (lP.isArray(tree)) {
    return '[' + lP.map(lP.serializeTree, tree).join(', ') + ']';
  }
  return '' + tree;
};

lP.serializeTerm = function(term) {
  if (lP.isArray(term)) {
    var i;
    var result = '';
    result += term[0] + '(';
    for (i = 1; i < term.length; i++) {
      result += lP.serializeTerm(term[i]);
      if (i + 1 < term.length) result += ',';
    }
    result += ')';
    return result;
  }
  return term;
};

//#############################################################################
// Parsing logic
//#############################################################################

lP.Parser = function() {
};

lP.Parser.prototype = {
  parseTerms: function(rawString) {
    var result = [];
    var pos = 0;
    rawString = rawString.replace(/[^a-zA-Z_(,)]/g, '');
    while (pos < rawString.length) {
      var term = this.parseTerm(rawString, pos);
      if (term[1] === -1) return -1;
      result.push(term[0]);
      pos = term[1];
    }

    return result;
  },

  parseTerm: function(rawString, pos) {
    var term;

    term = this.parseCompoundTerm(rawString, pos);
    if (term[1] !== -1) return term;

    term = this.parseAtom(rawString, pos);
    if (term[1] !== -1) return term;

    term = this.parseVariable(rawString, pos);
    if (term[1] !== -1) return term;

    return [[], -1];
  },

  parseCompoundTerm: function(rawString, pos) {
    var terms = [];
    var functor = this.parseAtom(rawString, pos);
    if (functor[1] === -1) return [[], -1];

    pos = functor[1];
    if (rawString.charAt(pos++) !== '(') return [[], -1];

    var result = [functor[0]];
    while (true) {
      var term = this.parseTerm(rawString, pos);
      if (term[1] === -1) return [[], -1];
      pos = term[1];
      if (rawString.charAt(pos) === ')') {
        pos++;
        result.push(term[0]);
        break;
      }
      if (rawString.charAt(pos) === ',') {
        pos++;
        result.push(term[0]);
        continue;
      }
      return [[], -1];
    }

    return [result, pos];
  },

  parseAtom: function(rawString, pos) {
    var name = '';
    while (pos < rawString.length) {
      var ch = rawString.charCodeAt(pos++);
      if (ch >= 65 && ch <= 90) { // 'A' - 'Z'
        if (0 === name.length) return [[], -1];
        name += String.fromCharCode(ch);
      }
      else if (ch >= 97 && ch <= 122) { // 'a' - 'z'
        name += String.fromCharCode(ch);
      }
      else if (ch === 95) { // '_'
        if (0 === name.length) return [[], -1];
        name += String.fromCharCode(ch);
      }
      else {
        pos--;
        break;
      }
    }

    return (name.length > 0) ? [name, pos] : [[], -1];
  },

  parseVariable: function(rawString, pos) {
    var name = '';
    while (pos < rawString.length) {
      var ch = rawString.charCodeAt(pos++);
      if (ch >= 65 && ch <= 90) { // 'A' - 'Z'
        name += String.fromCharCode(ch);
      }
      else if (ch >= 97 && ch <= 122) { // 'a' - 'z'
        if (0 === name.length) return [[], -1];
        name += String.fromCharCode(ch);
      }
      else if (ch === 95) { // '_'
        if (0 === name.length) return [[], -1];
        name += String.fromCharCode(ch);
      }
      else {
        pos--;
        break;
      }
    }

    return (name.length > 0) ? ['?' + name, pos] : [[], -1];
  }
};

//#############################################################################
// Utility functions
//#############################################################################

lP.isArray = function(value) {
  if (Object.prototype.toString.call(value) === '[object Array]') return true;
  return false;
};

lP.isString = function(value) {
  if (typeof value === 'string') return true;
  return false;
};

lP.isVariable = function(value) {
  if (lP.isString(value) && value.indexOf('?') === 0) return true;
  return false;
};

lP.isAnd = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'and') return true;
  return false;
};

lP.isOr = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'or') return true;
  return false;
};

lP.isNot = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'not') return true;
  return false;
};

lP.map = function(func, arr) {
  var i;
  var result = [];
  for (i = 0; i < arr.length; i++) {
    result.push(func(arr[i]));
  }
  return result;
};

lP.uniqueValues = function(arr) {
  var i;
  var result = new Array();
  arr.sort();
  for (i = 0; i < arr.length; i++) {
    if (i == 0 || arr[i] != arr[i - 1]) {
      result.push(arr[i]);
    }
  }

  return result;
};

lP.extractVariables = function(tree) {
  var i;
  var vars;
  var result = new Array();

  if (lP.isVariable(tree)) {
    result.push(tree);
  }
  else if (lP.isArray(tree)) {
    for (i = 0; i < tree.length; i++) {
      vars = lP.extractVariables(tree[i]);
      result = result.concat(vars);
    }
  }

  return lP.uniqueValues(result);
};

//#############################################################################
// Simplified interface
//#############################################################################

lP.solve = function(program, maxSolutions) {
  var terms = (new lP.Parser()).parseTerms(program);
  if (terms === -1) {
    return 'Invalid Program Syntax';
  }
  else {
    var i;
    var db = new lP.Database();
    var result = '';
    for (i = 0; i < terms.length; i++) {
      if (terms[i][0] === 'fact') {
        db.addAssertion(new lP.Assertion(terms[i][1]));
      }
      else if (terms[i][0] === 'rule') {
        db.addRule(new lP.Rule(terms[i][1], terms[i][2]));
      }
      else if (terms[i][0] === 'query') {
        var resultStream = lP.qeval(
            db,
            terms[i][1],
            streams.singletonStream(lP.EMPTY_FRAME));
        if (result.length > 0) result += '\n############################\n\n';
        if (resultStream.isEmpty()) result += 'No Solution\n';
        else result += 'Has a solution\n';
        resultStream.take(maxSolutions).forEach(
            function(frame) {
              var j;
              var vars = lP.extractVariables(terms[i][1]);
              result += 'Variables:\n';
              for (j = 0; j < vars.length; j++) {
                result += vars[j].substring(1) + ' = ' +
                    lP.serializeTerm(lP.instantiate(vars[j], frame)) + '\n';
              }
            });
      }
    }
    return result;
  }
};

