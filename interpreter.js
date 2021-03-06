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
  *
  * Example usage:
  *   jrunscript interpreter.js
  *
  *   >> fact(natural(zero))
  *   >> rule(natural(s(X)), natural(X))
  *   >> query(natural(X))
  *   X = zero
  *   X = s(zero)
  *   X = s(s(zero))
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

  java.lang.System.out.println(
      "This is the logic programming system's command line interpreter!");
  java.lang.System.out.println();
  java.lang.System.out.println(
      'You can enter 3 types of commands:');
  java.lang.System.out.println(
      '  1) facts: fact(natural(zero))');
  java.lang.System.out.println(
      '  2) rules: rule(natural(succ(X)), natural(X))');
  java.lang.System.out.println(
      '  3) queries: query(natural(X))');
  java.lang.System.out.println();
  java.lang.System.out.println(
      "To quit the interpreter enter the 'quit' command");
  java.lang.System.out.println();

  db = new lP.Database();
  scanner = new java.util.Scanner(java.lang.System['in']);

  while (true) {
    java.lang.System.out.print('>> ');
    line = (new String(scanner.nextLine())).toString();
    if (line === 'quit') break;

    pattern = (new lP.Parser()).parseTerms(line)[0];
    if (interpreter.isFact(pattern)) {
      db.addAssertion(new lP.Assertion(pattern[1]));
      java.lang.System.out.println('Fact added to database.');
    }
    else if (interpreter.isRule(pattern)) {
      db.addRule(new lP.Rule(pattern[1], pattern[2]));
      java.lang.System.out.println('Rule added to database.');
    }
    else if (interpreter.isQuery(pattern)) {
      // At most 10 results are computed.
      lP.qeval(
          db,
          pattern[1],
          streams.singletonStream(lP.EMPTY_FRAME)).take(10).forEach(
              function(frame) {
                var j;
                var vars = lP.extractVariables(pattern[1]);
                java.lang.System.out.println('Result:');
                for (j = 0; j < vars.length; j++) {
                  java.lang.System.out.print(vars[j].substring(1) + ' = ');
                  java.lang.System.out.println(lP.serializeTerm(
                      lP.instantiate(vars[j], frame)));
                }
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

