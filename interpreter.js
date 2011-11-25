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
  * This module implements a simple command line interface to the logic
  * programming system.
  *
  * Example usage:
  *   jrunscript interpreter.js
  *
  *   >> ['fact', ['natural', 'zero']]
  *   >> ['rule', ['natural', ['s', '?x']], ['natural', '?x']]
  *   >> ['query', ['natural', '?x']]
  *   ['natural', 'zero']
  *   ['natural', ['s', 'zero']]
  *   ['natural', ['s', ['s', 'zero']]]
  *   ...
  *   ...
  *   >> quit
  *
  *
  * @author Ivan Vladimirov Ivanov (ivan.vladimirov.ivanov@gmail.com)
  */

interpreter = {};

interpreter.isFact = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'fact') {
    return true;
  }
  return false;
};

interpreter.isRule = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'rule') {
    return true;
  }
  return false;
};

interpreter.isQuery = function(value) {
  if (lP.isArray(value) && value.length > 0 && value[0] === 'query') {
    return true;
  }
  return false;
};

interpreter.REPL = function() {
  var db;
  var scanner;
  var pattern;
  var line;

  db = new lP.Database();
  scanner = new java.util.Scanner(java.lang.System['in']);

  while (true) {
    java.lang.System.out.print('>> ');
    line = (new String(scanner.nextLine())).toString();
    if (line === 'quit') break;

    pattern = eval(line);
    if (interpreter.isFact(pattern)) {
      db.addAssertion(new lP.Assertion(pattern[1]));
    }
    else if (interpreter.isRule(pattern)) {
      db.addRule(new lP.Rule(pattern[1], pattern[2]));
    }
    else if (interpreter.isQuery(pattern)) {
      // At most 100 results are computed.
      lP.qeval(
          db,
          pattern[1],
          streams.singletonStream(lP.EMPTY_FRAME)).take(100).forEach(
              function(frame) {
                var result = lP.instantiate(pattern[1], frame);
                java.lang.System.out.println(
                    lP.serializeTree(result));
              });
    }
    else {
      java.lang.System.out.println('Invalid command!');
    }
  }
};

load('logic_programming.js');
load('streams.js');
interpreter.REPL();


