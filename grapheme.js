(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Grapheme = global.Grapheme || {})));
}(this, (function (exports) {

  // Internals

  const defaultAngleThreshold = 0.5;
  const MAXRECURSION = 30;

  var Global = {
    maxVariableLength: 32
  }

  function fastATAN(y, x) {
    // Fast version of atan2, returning results in taxicab angle format

    return (y >= 0 ? (x >= 0 ? y/(x+y) : 1-x/(-x+y)) : (x < 0 ? 2-y/(-x-y) : 3+x/(x-y)));
  }

  function highAngle(y1, x1, y2, x2, angleThreshold = defaultAngleThreshold) {
    // Tests if an angle between two points and the origin is too large

    return (Math.abs(fastATAN(y1, x1) - fastATAN(-y2, -x2)) > angleThreshold);
  }

  // Exports

  class ViewWindow {
    // This class implements an abstraction for a viewing area, storing xmin, xmax, ymin, and ymax

    constructor(parentCanvas, xmin, xmax, ymin, ymax) {
      this.parentCanvas = parentCanvas;

      this.xmin = xmin || -5;
      this.xmax = xmax || 5;
      this.ymin = ymin || -5;
      this.ymax = ymax || 5;
    }

    copyFrom(viewWindow) {
      // Copy position from viewWindow to this instance
      if (!(viewWindow instanceof ViewWindow)) {
        throw "Cannot copy from an object that is not an instance of ViewWindow";
      }
      this.xmax = viewWindow.xmax;
      this.xmin = viewWindow.xmin;
      this.ymax = viewWindow.ymax;
      this.ymin = viewWindow.ymin;
    }

    copyTo(viewWindow) {
      // Copy position from this instance to viewWindow
      if (!(viewWindow instanceof ViewWindow)) {
        throw "Cannot copy to an object that is not an instance of ViewWindow";
      }

      viewWindow.xmax = this.xmax;
      viewWindow.xmin = this.xmin;
      viewWindow.ymax = this.ymax;
      viewWindow.ymin = this.ymin;
    }

    area() {
      return this.xdelta * this.ydelta;
    }

    perimeter() {
      return 2 * (this.xdelta + this.ydelta);
    }

    get WIDTH() {
      return this.parentCanvas.width;
    }

    get HEIGHT() {
      return this.parentCanvas.height;
    }

    get xdelta() {
      return this.xmax - this.xmin;
    }

    get ydelta() {
      return this.ymax - this.ymin;
    }

    translate(x, y, screenCoords = false) {
      // Move view window by (x, y)
      if (screenCoords) {
        x = this.scaleCanvasXtoPointX(x);
        y = this.scaleCanvasYtoPointY(y);
      }
      this.xmin += x;
      this.xmax += x;
      this.ymin += y;
      this.ymax += y;
    }

    zoom(x, y, zoomFactor, screenCoords = false) {
      // Zoom view into (x, y) by factor zoomFactor
      if (screenCoords) {
        x = this.canvasXtoPointX(x);
        y = this.canvasYtoPointY(y);
      }

      this.xmin = zoomFactor * (this.xmin - x) + x;
      this.xmax = zoomFactor * (this.xmax - x) + x;
      this.ymin = zoomFactor * (this.ymin - y) + y;
      this.ymax = zoomFactor * (this.ymax - y) + y;
    }

    // Transform operations

    scaleCanvasXtoPointX(x) {
      return -x * this.xdelta / this.WIDTH;
    }

    scaleCanvasYtoPointY(y) {
      return y * this.ydelta / this.HEIGHT;
    }

    canvasXtoPointX(x) {
      return x * this.xdelta / this.WIDTH + this.xmin;
    }

    canvasYtoPointY(y) {
      return (1 - (y / this.HEIGHT)) * this.ydelta + this.ymin;
    }

    pointXtoCanvasX(x) {
      return this.WIDTH * (x - this.xmin) / this.xdelta;
    }

    pointYtoCanvasY(y) {
      return this.HEIGHT * (1 - (y - this.ymin) / this.ydelta);
    }

    canvasPointToPoint(x, y) {
      return [canvasXtoPointX(x), canvasYtoPointY(x)];
    }

    pointToCanvasPoint(x,y) {
      return [pointXtoCanvasX(x), pointYtoCanvasY(x)];
    }
  }

  class GraphingContext {
    constructor(canvas, ctx, settings) {
      this.canvas = canvas;
      this.ctx = ctx;

      this.functions = [];

      if (settings) {
        this.angleThreshold = settings.angleThreshold || 0.02;
        this.epsilon = settings.epsilon || 1e-6;
        this.density = settings.density || 400;

        this.view = settings.view || new ViewWindow(this.canvas, -5, 5, -5, 5);
      } else {
        this.angleThreshold = 0.5;
        this.epsilon = 1e-6;
        this.density = 100;

        this.view = new ViewWindow(this.canvas, -5, 5, -5, 5);
      }
    }

    clearCanvas() {
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

    line(x1, y1, x2, y2) {
      this.ctx.moveTo(this.view.pointXtoCanvasX(x1),
                      this.view.pointYtoCanvasY(y1));
      this.ctx.beginPath();
      this.ctx.lineTo(this.view.pointXtoCanvasX(x2),
                      this.view.pointYtoCanvasY(y2));
      this.ctx.stroke();
    }

    graphPoint(x, y) {
      this.ctx.beginPath();
      this.ctx.arc(this.view.pointXtoCanvasX(x), this.view.pointYtoCanvasY(y), 3, 0, 2*Math.PI);
      this.ctx.stroke();
    }

    graphLine(x1, y1, x2, y2, move = true) {
      // this.graphPoint(x1, y1);
      this.ctx.beginPath();
      if (move) {
        this.ctx.moveTo(this.view.pointXtoCanvasX(x1), this.view.pointYtoCanvasY(y1));
      }
      this.ctx.lineTo(this.view.pointXtoCanvasX(x2), this.view.pointYtoCanvasY(y2));
      this.ctx.stroke();
    }

    graphAll() {
      for (let i = 0; i < this.functions.length; i++) {
        this.functions[i].graph();
      }
    }

    addFunction(func) {
      this.functions.push(new ContinuousFunction(func, this));
    }
  }

  class StaticLine {
    constructor(m, b, graphingCtx) {
      this.func = function(x) {
        return m * x + b;
      }

      this.m = m;
      this.b = b;
    }
  }

  class ContinuousFunction {
    constructor(func, graphingCtx) {
      this.func = eval(func);
      this.graphingCtx = graphingCtx;
      this.view = graphingCtx.view;
      this.canvas = graphingCtx.canvas;

      this.DENSITY = 100;
      this.EPSILON = 1e-6;
      this.MAXRECURSION = 50;

      this.FUDGE = 50;
    }

    evaluate(x) {
      x = +x;
      return this.func(x);
    }

    derivativeEval(x) {
      return (this.func(x + this.EPSILON) - this.func(x - this.EPSILON)) / this.EPSILON;
    }

    derivative() {
      if (!this.cachedDerivative) {
        let that = this;
        this.cachedDerivative = new MathFunction(
            function(x) {
              x = +x;
              return (that.func(x + that.EPSILON) - that.func(x - that.EPSILON)) / that.EPSILON;
            }
          );
        }
      return this.cachedDerivative;
    }

    get smallestDistanceX() {
      return this.FUDGE * this.view.xdelta / Math.max(this.canvas.width, 2 * this.FUDGE * this.DENSITY);
    }

    get smallestDistanceY() {
      return this.FUDGE * this.view.ydelta / Math.max(this.canvas.width, 2 * this.FUDGE * this.DENSITY);
    }

    tooSmall(x1, x2, y1, y2) {
      return (Math.abs(x1 - x2) < this.smallestDistanceX &&
              Math.abs(y1 - y2) < this.smallestDistanceY);
    }

    fixArea(x1, x2, x3, y1, y2, y3, depth = -1) {
      if (depth > this.MAXRECURSION || this.tooSmall(x1, x2, y1, y2)) return;
      let xp = (x1 + x2) / 2;
      let yp = this.func(xp);

      if (highAngle(y3 - y2, x3 - x2, yp - y2, xp - x2, this.angleThreshold)) {
        this.fixArea(x1, xp, x2, y1, yp, y2, depth + 1);
      }

      // this.graphingCtx.graphPoint(x2, y2);
      this.graphingCtx.graphLine(this.prevx, this.prevy, x2, y2);
      this.prevx = x2;
      this.prevy = y2;

      xp = (x2 + x3) / 2;
      yp = this.func(xp);

      if (highAngle(yp - y2, xp - x2, y1 - y2, x1 - x2, this.angleThreshold)) {
        this.fixArea(x2, xp, x3, y2, yp, y3, depth + 1);
      }
    }

    graph(xstart, xend, xjump) {
      if (!xstart && xstart != 0) {
        xstart = this.view.xmin - 4 * this.view.xdelta / this.DENSITY;
      }
      if (!xend && xend != 0) {
        xend = this.view.xmax + 4 * this.view.xdelta / this.DENSITY;
      }
      if (!xjump && xjump != 0) {
        xjump = this.view.xdelta / this.DENSITY;
      }

      var prev1 = 0;
      var prev2 = 0;
      var prev3 = 0;

      var previ1 = 0;
      var previ2 = 0;
      var previ3 = 0;

      let j = 0;

      this.prevx = xstart;
      this.prevy = this.func(xstart);

      for (let i = xstart; i < xend; i += xjump) {
        j++;

        prev1 = prev2;
        prev2 = prev3;
        prev3 = this.func(i);

        previ1 = previ2;
        previ2 = previ3;
        previ3 = i;
        if (j > 3) {
          this.fixArea(previ1, previ2, previ3, prev1, prev2, prev3);
        }
      }
    }
  }

  class Operator {
    constructor(type, execute, props) {
      this.type = type;
      this.execute = execute;

      this.props = props || {};
    }

    evaluate(args) {
      return this.execute(args);
    }
  }

  var ADD = (x, y) => x + y;
  var MUL = (x, y) => x * y;

  var OPS = {
    NULL: new Operator('NULL', function(args) {
      return NaN;
    }),
    NEG: new Operator('NEG', function(args) { // Negation of number
      return -args[0];
    }, {ownInverse: true}),
    ADD: new Operator('ADD', function(args) { // Addition, unlimited args
      return args.reduce(ADD);
    }, {associative: true, commutative: true, distributive: true}),
    MUL: new Operator('MUL', function(args) { // Addition, unlimited args
      return args.reduce(MUL);
    }, {associative: true, commutative: true, distributive: true}),
    SUB: new Operator('SUB', function(args) { // Subtraction, two args
      return args[0] - args[1];
    }),
    DIV: new Operator('DIV', function(args) { // Division, two args
      return args[0] / args[1];
    }),
    SIN: new Operator('SIN', function(args) { // Sine
      return Math.sin(args[0]);
    }),
    COS: new Operator('COS', function(args) { // Cosine
      return Math.cos(args[0]);
    }),
    TAN: new Operator('TAN', function(args) { // Tangent
      return Math.tan(args[0]);
    }),
    CSC: new Operator('CSC', function(args) { // Cosecant
      return 1 / Math.sin(args[0]);
    }),
    SEC: new Operator('SEC', function(args) { // Secant
      return 1 / Math.cos(args[0]);
    }),
    COT: new Operator('COT', function(args) { // Cotangent
      return 1 / Math.tan(args[0]);
    }),
    SGN: new Operator('SGN', function(args) {
      return Math.sign(args[0]);
    }),
    POW: new Operator('EXP', function(args) {
      return Math.pow(args[0], args[1]);
    }),
    SQRT: new Operator('SQRT', function(args) {
      return Math.sqrt(args[0]);
    }),
    EXP: new Operator('EXP', function(args) {
      return Math.exp(args[0]);
    })
  }

  class Variable {
    constructor(name) {
      if (name.length > Global.maxCharacterLength) {
        throw "Max character length of " + Global.maxCharacterLength + " exceeded.";
      }
      this.name = name;
    }

    evaluate(vars) {
      return (vars[this.name] !== undefined ? vars[this.name] : 0);
    }

    is(variable) {
      return (this.name === variable.name);
    }

    isConstant() {
      return false;
    }

    isVariable() {
      return true;
    }

    isNode() {
      return false;
    }

    deepCopy() {
      return new Variable(this.name);
    }
  }

  class Constant {
    constructor(value) {
      this.value = +value;
    }

    evaluate() {
      return this.value;
    }

    equals(constant) {
      return (this.value === constant.value);
    }

    close(constant, eps = 1e-9) {
      return (Math.abs(this.value - constant.value) < eps);
    }

    isConstant() {
      return true;
    }

    isVariable() {
      return false;
    }

    isNode() {
      return false;
    }

    deepCopy() {
      return new Constant(this.value);
    }
  }

  class SpecialConstant {
    constructor(name, value) {
      this.name = name;
      this.value = value;
    }

    evaluate() {
      return +this.value;
    }

    equals(constant) {
      return (this.value === constant.value);
    }

    close(constant, eps = 1e-9) {
      return (Math.abs(this.value - constant.value) < eps);
    }

    isConstant() {
      return true;
    }

    isVariable() {
      return false;
    }

    isNode() {
      return false;
    }

    deepCopy() {
      return this;
    }
  }

  var Special = {
    PI: new SpecialConstant('PI', Math.PI),
    E: new SpecialConstant('E', Math.E)
  }

  var Axes = {
    x: new Variable('x'),
    y: new Variable('y')
  }

  // Terms:

  // Constant is if all children nodes are constant
  // Linear is if children nodes form a * variable + b

  class ASTNode {
    constructor(op, astList) {
      this.operator = op;
      this.tree = astList;

      this.props = {};
    }

    evaluate(vars) {
      return (this.operator.evaluate(this.tree.map(x => x.evaluate(vars))));
    }

    isConstant() {
      if (this.props.isConstant !== undefined) return this.props.isConstant;
      for (let i = 0; i < this.tree.length; i++) {
        if (!this.tree[i].isConstant()) {
          this.props.isConstant = false;
          return false;
        }
      }
      this.props.isConstant = true;
      return true;
    }

    isNode() {
      return true;
    }

    deepCopy() {
      return new ASTNode(this.operator, this.tree.map(x => x.deepCopy()));
    }

    traverseNodes(applyFunc, tail = true) {
      if (!tail) {
        if (applyFunc(this)) return;
      }
      for (let i = 0; i < this.tree.length; i++) {
        if (this.tree[i].traverseNodes) {
          this.tree[i].traverseNodes(applyFunc);
        } else {
          applyFunc(this.tree[i]);
        }
      }
      if (tail) {
        if (applyFunc(this)) return;
      }
    }

    traverseNodesAsParent(applyFunc, tail = true, rewrite = false) {
      for (let i = 0; i < this.tree.length; i++) {
        if (this.tree[i].traverseNodesAsParent) {
          if (!tail) {
            if (rewrite) {
              let result = applyFunc(this.tree, i);
              if (result) this.tree[i] = result;
            } else {
              applyFunc(this.tree, i);
            }
          }
          if (!tail && this.tree[i].traverseNodesAsParent) {
            this.tree[i].traverseNodesAsParent(applyFunc, tail, rewrite);
          }
          if (tail) {
            if (rewrite) {
              let result = applyFunc(this.tree, i);
              if (result) this.tree[i] = result;
            } else {
              applyFunc(this.tree, i);
            }
          }
        }
      }
    }

    constantValue() {
      if (this.props.constantValue !== undefined) return this.props.constantValue;
      if (this.isConstant()) {
        this.props.constantValue = this.evaluate();
        return this.props.constantValue;
      }
    }

    isAllAddition() {
      if (this.operator.type === 'ADD' || this.operator.type === 'NEG') {
        for (let i = 0; i < this.tree.length; i++) {
          if (this.tree[i].isAllAddition && !this.tree[i].isAllAddition()) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    clearProps() {
      this.props = {};
    }

    deepClearProps() {
      traverseNodes(function(ast) {
        if (ast.isNode()) {
          ast.deepClearProps();
        }
      });
    }
  }

  function collapseConstants(ast, modify = true) {
    // Collapses constants to simple constants. If modify is true it will modify the original AST; otherwise it will return a new one
    if (modify) {
      ast.traverseNodesAsParent(function(ast, i) {
        if (ast[i].isNode() && ast[i].isConstant()) {
          return new Grapheme.Constant(ast[i].constantValue())};
        }, false, true);
    } else {
      let astCopy = ast.deepCopy();
      astCopy.traverseNodesAsParent(function(ast, i) {
        if (ast[i].isNode() && ast[i].isConstant()) {
          return new Grapheme.Constant(ast[i].constantValue())};
        }, false, true);
      return astCopy;
    }
  }

  function collapseAdditions(ast, modify = true) {
    // Collapses nesting addition operators into one addition operator
    ast.traverseNodes(function(ast) {
      if (ast.isNode() && ast.isAllAddition()) {
        var additionList = [];
        ast.traverseNodes(function(x) {
          if (!x.traverseNodes) {
            additionList.push(x);
          }
        });
        ast.operator = OPS.ADD;
        ast.tree = additionList;
      }
    }, false, true);
  }

  function collapseMultiplications(ast, modify = true) {
    // Collapses nesting addition operators into one addition operator
    ast.traverseNodes(function(ast) {
      if (ast.isNode() && ast.isAllMultiplication()) {
        var multiplicationList = [];
        ast.traverseNodes(function(x) {
          if (!x.traverseNodes) {
            multiplicationList.push(x);
          }
        });
        ast.operator = OPS.MUL;
        ast.tree = multiplicationList;
      }
    }, false, true);
  }

  function parenthesesBalanced(string) {
    let depth = 0;

    for (let i = 0; i < string.length; i++) {
      if (string[i] === '(') depth++;
      else if (string[i] === ')') depth--;

      if (depth < 0) return false;
    }

    return depth === 0;
  }

  function* stringFuncTokenizer(string) {
    if (!parenthesesBalanced(string)) {
      yield -1;
      return;
    } else {
      yield 0;
    }

    let c, name, depth = 0;

    for (let i = 0; i < string.length; i++) {
      c = string[i];

      if (c === '(') depth++;
      else if (c === ')') depth--;

      if (depth < 0) {
        throw "Unbalanced parentheses at char " + i + ".";
        return null;
      }

      if (c === '(') {
        if (i >= 1) {

          name = "";
          let j = i - 1;

          for (; j >= 0; j--) {
            if (!isLetter(string[j])) {
              break;
            }
          }

          if (i - j <= 1) continue;

          name = string.slice(j + 1, i);
          yield {data: {type: 0, value: name}};
        }
      } else if (c === ')') {
        yield {data: {type: 1}};
      } else if (c === '&') {
        if (i >= 1) {

          name = "";
          let j = i - 1;

          for (; j >= 0; j--) {
            if (string[j] === '(' || string[j] === ')' || string[j] === ',') {
              break;
            }
          }

          if (i - j <= 1) continue;

          name = string.slice(j + 1, i);
          yield {data: {type: 2, value: name}};
        }
      }
    }
  }

  var findOperator = opname => (OPS[opname] ? OPS[opname] : OPS.NULL);

  var isConstant = opname => !isNaN(parseFloat(opname));

  var isLetter = function(a) {
    let x = a.charCodeAt();
    return (x > 64 && x < 91) || (x > 96 && x < 123);
  }

  function findNumber(opname) {
    if (Special[opname]) {
      return Special[opname];
    } else if (Axes[opname]) {
      return Axes[opname];
    } else if (isConstant(opname)) {
      return new Constant(+opname);
    } else {
      return new Variable(opname);
    }
  }

  function ASTFromStringFunc(string) {
    // Syntax example: ADD(ADD(x&,3),MUL(x&,x&))

    // Equivalent to x + 4 + 5 - x * 5
    // Note: all operators are either 0, 1, or 2 input

    let opStack = [];

    let tokenizer = stringFuncTokenizer(string);
    let nextToken = tokenizer.next();

    if (nextToken === -1) {
      return null;
    }

    while (true) {
      nextToken = tokenizer.next();
      if (nextToken.done) break;

      if (nextToken.value.data.type === 0) {
        opStack.push(findOperator(nextToken.value.data.value));
      } else if (nextToken.value.data.type === 1) {
        let i = opStack.length - 1;

        for (; i >= 0; i--) {
          if (opStack[i] instanceof Operator) {
            break;
          }
        }

        let newOp = new ASTNode(opStack[i], opStack.slice(i + 1));

        opStack.splice(i);
        opStack.push(newOp);
      } else if (nextToken.value.data.type === 2) {
        opStack.push(findNumber(nextToken.value.data.value));
      }
    }

    if (opStack.length !== 1) {
      // Malformed function
      return null;
    }

    return opStack[0];
  }

  exports.ViewWindow = ViewWindow;
  exports.GraphingContext = GraphingContext;
  exports.ContinuousFunction = ContinuousFunction;
  exports.Variable = Variable;
  exports.ASTNode = ASTNode;
  exports.Constant = Constant;
  exports.Operator = Operator;
  exports.OPS = OPS;
  exports.Global = Global;
  exports.stringFuncTokenizer = stringFuncTokenizer;
  exports.ASTFromStringFunc = ASTFromStringFunc;
  exports.collapseConstants = collapseConstants;
  exports.collapseAdditions = collapseAdditions;

})));
