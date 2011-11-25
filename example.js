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
  * A small module that demonstrates the interface of the logic programming
  * system with some number theoretic examples.
  *
  * @author Ivan Vladimirov Ivanov (ivan.vladimirov.ivanov@gmail.com)
  */

example = {};

example.main = function() {
  var database = new lP.Database();
  database.addAssertion(new lP.Assertion(['natural', 'zero']));
  database.addAssertion(new lP.Assertion(['factorial', 'zero', ['s', 'zero']]));
  database.addRule(new lP.Rule(
      ['natural', ['s', '?x']],
      ['natural', '?x']));
  database.addRule(new lP.Rule(
      ['plus', 'zero', '?x', '?x'],
      ['natural', '?x']));
  database.addRule(new lP.Rule(
      ['plus', ['s', '?x'], '?y', ['s', '?z']],
      ['plus', '?x', '?y', '?z']));
  database.addRule(new lP.Rule(
      ['times', 'zero', '?x', 'zero'],
      ['natural', '?x']));
  database.addRule(new lP.Rule(
      ['times', ['s', '?x'], '?y', '?z'],
      ['and', ['times', '?x', '?y', '?xy'], ['plus', '?y', '?xy', '?z']]));
  database.addRule(new lP.Rule(
      ['less', 'zero', ['s', '?x']],
      ['natural', '?x']));
  database.addRule(new lP.Rule(
      ['less', ['s', '?x'], ['s', '?y']],
      ['less', '?x', '?y']));
  database.addRule(new lP.Rule(
      ['mod', '?x', '?y', '?x'],
      ['less', '?x', '?y']));
  database.addRule(new lP.Rule(
      ['mod', '?x', '?y', '?z'],
      ['and', ['plus', '?x1', '?y', '?x'], ['mod', '?x1', '?y', '?z']]));
  database.addRule(new lP.Rule(
      ['gcd', '?x', 'zero', '?x'],
      ['less', 'zero', '?x']));
  database.addRule(new lP.Rule(
      ['gcd', '?x', '?y', '?gcd'],
      ['and', ['mod', '?x', '?y', '?z'],
              ['gcd', '?y', '?z', '?gcd']]));
  database.addRule(new lP.Rule(
      ['factorial', ['s', '?n'], '?x'],
      ['and', ['factorial', '?n', '?y'],
              ['times', ['s', '?n'], '?y', '?x']]));

  // Compute 4!
  var query = ['factorial', ['s', ['s', ['s', ['s', 'zero']]]], '?x'];

  lP.qeval(
      database,
      query,
      streams.singletonStream(lP.EMPTY_FRAME)).take(1).forEach(
          function(frame) {
              var result = lP.instantiate(query, frame);
              java.lang.System.out.println(lP.serializeTree(result));
          });

  // Compute n, such that n! = 6
  query = ['factorial', '?x', ['s', ['s', ['s', ['s', ['s', ['s', 'zero']]]]]]];

  lP.qeval(
      database,
      query,
      streams.singletonStream(lP.EMPTY_FRAME)).take(1).forEach(
          function(frame) {
              var result = lP.instantiate(query, frame);
              java.lang.System.out.println(lP.serializeTree(result));
          });

  // Compute gcd(3, 2).
  query = ['gcd', ['s', ['s', ['s', 'zero']]], ['s', ['s', 'zero']], '?x'];

  lP.qeval(
      database,
      query,
      streams.singletonStream(lP.EMPTY_FRAME)).take(1).forEach(
          function(frame) {
              var result = lP.instantiate(query, frame);
              java.lang.System.out.println(lP.serializeTree(result));
          });
};

load('streams.js');
load('logic_programming.js');
example.main();

