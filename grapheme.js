(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Grapheme = global.Grapheme || {})));
}(this, (function (exports) {

  // Internals

  const defaultAngleThreshold = 0.5;
  const MAXRECURSION = 30;

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
      this.name = name;
      this.isVariable = true;
    }

    evaluate(vars) {
      return (vars[this.name] !== undefined ? vars[this.name] : 0);
    }

    is(variable) {
      return (this.name === variable.name);
    }

    deepCopy() {
      return new Variable(this.name);
    }
  }

  class Constant {
    constructor(value) {
      this.value = +value;
      this.isConstant = true;
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

    deepCopy() {
      return new Constant(this.value);
    }
  }

  class SpecialConstant {
    constructor(name, value) {
      this.name = name;
      this.value = value;

      this.isConstant = true;
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
    constructor(op, tree, parent) {
      this.operator = op;
      this.tree = tree;

      if (!parent) {
        this.topNode = true;
      } else {
        this.parent = parent;
        this.topNode = false;
      }

      this.props = {};
      this.isNode = true;
    }

    clearProps() {
      this.props = {};
    }

    deepClearProps() {
      for (let i = 0; i < this.tree.length; i++) {
        if (this.tree[i].isNode) {
          this.tree[i].deepClearProps();
        }
      }
    }

    surfaceClearProps() {
      this.props = {};
      if (this.topNode) return;
      this.parent.surfaceClearProps();
    }

    traverseBranches(applyFunc, tailCall = true) {
      for (let i = 0; i < this.tree.length; i++) {
        if (this.tree[i].isNode) {
          if (!tailCall) applyFunc(this);
          this.tree[i].traverseBranches(applyFunc, tailCall);
          if (tailCall) applyFunc(this);
        }
      }
    }

    traverseNodesAsParent(applyFunc, tailCall = true) {
      for (let i = 0; i < this.tree.length; i++) {
        if (!tailCall) applyFunc(this, i);
        if (this.tree[i].isNode) {
          this.tree[i].traverseNodesAsParent(applyFunc, tailCall);
        }
        if (tailCall) applyFunc(this, i);
      }
    }

    fixParents(parent) {
      if (parent) {
        this.parent = parent;
        this.topNode = false;
      }

      for (let i = 0; i < this.tree.length; i++) {
        if (this.tree[i].isNode) {
          this.tree[i].fixParents(this);
        }
      }
    }

    evaluate(vars) {
      return this.operator.evaluate(this.tree.map(x => x.evaluate(vars)));
    }

    deepCopy() {
      return new ASTNode(this.operator, this.tree.map(x => x.deepCopy()), this.parent);
    }
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

    opStack[0].fixParents();

    return new FunctionAST(opStack[0]);
  }

  var isASTConstant = function(ast, cache = true, cacheRecursively = true) {
    if (ast.isNode) {
      if (ast.props.isASTConstant !== undefined) return ast.props.isASTConstant;
      for (let i = 0; i < ast.tree.length; i++) {
        if (!isASTConstant(ast.tree[i], cacheRecursively, cacheRecursively)) {
          if (cache) ast.props.isASTConstant = false;
          return false;
        }
      }
      if (cache) ast.props.isASTConstant = true;
      return true;
    } else if (ast.isConstant) {
      return true;
    }
    if (cache && ast.isNode) ast.props.isASTConstant = false;
    return false;
  }

  var ASTConstantValue = function(ast, cache = true, cacheRecursively = true) {
    if (isASTConstant(ast, cache, cacheRecursively)) {
      if (!cache) {
        return ast.evaluate();
      } else if (cache) {
        let result = ast.evaluate();
        ast.props.ASTConstantValue = result;
        return result;
      }
    }
  }

  var isASTAddition = function(ast, cache = true, cacheRecursively = true) {
    if (ast.isNode) {
      if (ast.props.isASTAddition !== undefined) return ast.props.isASTAddition;

      if (ast.operator.type === 'NEG' || ast.operator.type === 'ADD') {
        for (let i = 0; i < ast.tree.length; i++) {
          if (!isASTAddition(ast.tree[i], cacheRecursively, cacheRecursively)) {
            if (cache) ast.props.isASTAddition = false;
            return false;
          }
        }
      } else {
        if (cache) ast.props.isASTConstant = false;
        return false;
      }

      if (cache) ast.props.isASTConstant = true;
    }
    return true;
  }

  class FunctionAST {
    constructor(topnode) {
      this.tree = [topnode];
    }

    traverseNodesAsParent(applyFunc, tailCall = true) {
      for (let i = 0; i < this.tree.length; i++) {
        if (!tailCall) applyFunc(this, i);
        if (this.tree[i].isNode) {
          this.tree[i].traverseNodesAsParent(applyFunc, tailCall);
        }
        if (tailCall) applyFunc(this, i);
      }
    }

    collapseConstants(modify = true) {
      if (modify) {
        this.traverseNodesAsParent(function(ast, i) {
          if (isASTConstant(ast.tree[i])) {
            ast.tree[i] = new Constant(ast.tree[i].evaluate());
          }
        }, false);
      } else {
        let newAST = this.deepCopy();
        newAST.traverseNodesAsParent(function(ast, i) {
          if (isASTConstant(ast.tree[i])) {
            ast.tree[i] = new Constant(ast.tree[i].evaluate());
          }
        }, false);
        return newAST;
      }
    }
  }

  var Interval = {
    MUL: function(m1, m2) {
      let k = [];
      let next;
      for (let i = 0; i < m1.length; i += 2) {
        for (let j = 0; j < m2.length; j += 2) {
          next = Math.min(m1[i] * m2[j], m1[i] * m2[j + 1], m1[i + 1] * m2[j], m1[i + 1] * m2[j + 1]);
          k.push(next);
          next = Math.max(m1[i] * m2[j], m1[i] * m2[j + 1], m1[i + 1] * m2[j], m1[i + 1] * m2[j + 1]);
          k.push(next);
        }
      }
      return k;
    },
    ADD: function(m1, m2) {
      let k = [];
    }
  }

  exports.ViewWindow = ViewWindow;
  exports.GraphingContext = GraphingContext;
  exports.ContinuousFunction = ContinuousFunction;
  exports.Variable = Variable;
  exports.ASTNode = ASTNode;
  exports.Constant = Constant;
  exports.Operator = Operator;
  exports.OPS = OPS;
  exports.stringFuncTokenizer = stringFuncTokenizer;
  exports.ASTFromStringFunc = ASTFromStringFunc;
  exports.isASTConstant = isASTConstant;
  exports.ASTConstantValue = ASTConstantValue;
  exports.isASTAddition = isASTAddition;
  exports.Interval = Interval;

})));
