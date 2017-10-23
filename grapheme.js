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

    get minxd() {
      return 0.5 * (this.xmax - this.xmin) / (this.parentCanvas.width);
    }

    get minyd() {
      return 0.5 * (this.ymax - this.ymin) / (this.parentCanvas.height);
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

    graphAll(quality = 1) {
      for (let i = 0; i < this.functions.length; i++) {
        this.functions[i].graph(quality);
      }
    }

    addEquation(ast) {
      if (ast instanceof GeneralFunction) {
        this.functions.push(ast);
      } else if (ast instanceof Function) {
        this.functions.push(new GeneralFunction(ast, this));
      } else if (ast instanceof FunctionAST) {
        this.functions.push(new GeneralFunction(ast.compilehf(), this));
      }
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
    }),
    SQ: new Operator('SQ', function(args) {
      return args[0] * args[0];
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

    flatten() {
      if (this.name === 'x' || this.name === 'y') {
        return "[" + this.name + "1," + this.name + "2]";
      } else {
        return "vars." + this.name;
      }
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

    flatten() {
      return "[" + this.value + "," + this.value + "]";
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

    flatten() {
      return "[" + this.value + "," + this.value + "]";
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

    flatten() {
      let opname = this.operator.type;
      let flattened = this.tree.map(x => x.flatten()).join(',');
      return `Grapheme.Interval.${opname}(${flattened})`;
    }

    hf() {
      return eval(this.flatten());
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

    flatten() {
      let expr = this.tree[0].flatten();
      return `let intervals = ${expr};
        for (let i = 0; i < intervals.length; i += 2) {
          if (intervals[i] <= 0 && intervals[i + 1] >= 0) {
            return true;
          }
        }
        return false;`;
    }

    compilehf() {
      return Function("x1", "x2", "y1", "y2", this.flatten());
    }
  }

  var square = x => x*x;

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
      for (let i = 0; i < m1.length; i += 2) {
        for (let j = 0; j < m2.length; j += 2) {
          k.push(m1[i] + m2[j]);
          k.push(m1[i + 1] + m2[j + 1]);
        }
      }
      return k;
    },
    DIV: function(m2) {
      let k = [];
      let d1, d2;
      for (let i = 0; i < m2.length; i += 2) {
        if (m2[i] === 0 && m2[i + 1] === 0) continue;
        if (m2[i] <= 0 && m2[i + 1] >= 0) {
          k.push(-Infinity);
          k.push(1 / m2[i]);
          k.push(1 / m2[i + 1]);
          k.push(Infinity);
          continue;
        }
        d1 = 1 / m2[i + 1];
        d2 = 1 / m2[i];
        k.push(Math.min(d1, d2));
        k.push(Math.max(d1, d2));
      }
      return k;
    },
    SQ: function(m2) {
      let k = [];
      for (let i = 0; i < m2.length; i += 2) {
        if (m2[i] <= 0 && m2[i + 1] >= 0) {
          k.push(0);
          k.push(square(Math.max(Math.abs(m2[i]), Math.abs(m2[i + 1]))));
          continue;
        }
        k.push(square(Math.min(Math.abs(m2[i]), Math.abs(m2[i + 1]))));
        k.push(square(Math.max(Math.abs(m2[i]), Math.abs(m2[i + 1]))));
      }
      return k;
    },
    ABS: function(m2) {
      let k = [];
      for (let i = 0; i < m2.length; i++) {
        if (m2[i] === 0 && m2[i + 1] === 0) {
          k.push(0);
          k.push(0);
        } else if (m2[i] <= 0 && m2[i + 1] >= 0) {
          k.push(0);
          k.push(Math.max(Math.abs(m2[i]), Math.abs([i+1])));
          continue;
        } else {
          k.push(Math.min(Math.abs(m2[i]), Math.abs([i+1])));
          k.push(Math.max(Math.abs(m2[i]), Math.abs([i+1])));
        }
      }
      return k;
    },
    SGN: function(m2) {
      let k = [];
      for (let i = 0; i < m2.length; i++) {
        if (m2[i] < 0) {
          k.push(-1);
          k.push(-1);
        }
        if (m2[i + 1] > 0) {
          k.push(1);
          k.push(1);
        }
        if (m2[i] <= 0 && m2[i + 1] >= 0) {
          k.push(0);
          k.push(0);
        }
      }
      return k;
    },
    SIN: function(m2) {
      let k = [];
      let smin, smax;
      for (let i = 0; i < m2.length; i += 2) {
        if (m2[i + 1] - m2[i] >= 2 * Math.PI) {
          k.push(-1);
          k.push(1);
          continue;
        }
        smin = 2 * Math.PI * Math.floor((m2[i] + Math.PI / 2) / (2 * Math.PI)) + 3 * Math.PI / 2;
        smax = 2 * Math.PI * Math.floor((m2[i] + 3 * Math.PI / 2) / (2 * Math.PI)) + Math.PI / 2;
        if (m2[i] <= smin && smin <= m2[i + 1]) {
          if (m2[i] <= smax && smax <= m2[i + 1]) {
            k.push(-1);
            k.push(1);
            continue;
          }
          k.push(-1);
          k.push(Math.max(Math.sin(m2[i]), Math.sin(m2[i + 1])));
        } else {
          if (m2[i] <= smax && smax <= m2[i + 1]) {
            k.push(Math.min(Math.sin(m2[i]), Math.sin(m2[i + 1])));
            k.push(1);
            continue;
          }
          k.push(Math.min(Math.sin(m2[i]), Math.sin(m2[i + 1])));
          k.push(Math.max(Math.sin(m2[i]), Math.sin(m2[i + 1])));
        }
      }
      return k;
    },
    COS: function(m2) {
      let k = [];
      let smin, smax;
      for (let i = 0; i < m2.length; i += 2) {
        if (m2[i + 1] - m2[i] >= 2 * Math.PI) {
          k.push(-1);
          k.push(1);
          continue;
        }
        smin = 2 * Math.PI * Math.floor((m2[i] + Math.PI) / (2 * Math.PI)) + Math.PI;
        smax = 2 * Math.PI * Math.floor(m2[i] / (2 * Math.PI)) + 2 * Math.PI;
        if (m2[i] <= smin && smin <= m2[i + 1]) {
          if (m2[i] <= smax && smax <= m2[i + 1]) {
            k.push(-1);
            k.push(1);
            continue;
          }
          k.push(-1);
          k.push(Math.max(Math.cos(m2[i]), Math.cos(m2[i + 1])));
        } else {
          if (m2[i] <= smax && smax <= m2[i + 1]) {
            k.push(Math.min(Math.cos(m2[i]), Math.cos(m2[i + 1])));
            k.push(1);
            continue;
          }
          k.push(Math.min(Math.cos(m2[i]), Math.cos(m2[i + 1])));
          k.push(Math.max(Math.cos(m2[i]), Math.cos(m2[i + 1])));
        }
      }
      return k;
    },
    TAN: function(m2) {
      let k = [];
      let asympt;
      for (let i = 0; i < m2.length; i += 2) {
        if (m2[i + 1] - m2[i] >= Math.PI) {
          k.push(-Infinity);
          k.push(Infinity);
          continue;
        }
        asympt = Math.PI * Math.floor((m2[i] + Math.PI / 2) / Math.PI) + Math.PI / 2;
        if (m2[i] <= asympt && asympt <= m2[i + 1]) {
          k.push(Math.tan(m2[i]));
          k.push(Infinity);
          k.push(-Infinity);
          k.push(Math.tan(m2[i+1]));
        } else {
          k.push(Math.tan(m2[i]));
          k.push(Math.tan(m2[i+1]));
        }
      }
      return k;
    },
    CSC: function(m2) {

    }
  }

  class GeneralFunction {
    constructor(hf, graphingCtx) {
      this.hf = hf;
      this.graphingCtx = graphingCtx;
      this.view = graphingCtx.view;
      this.canvas = graphingCtx.canvas;

      this.HEAP = new Float32Array(250);
      this.graphing = false;
      this.cancelGraph = false;
    }

    asyncGraphRangeDFS(x1, x2, y1, y2, quality = 1, callback, startingIndex = -1) {
      this.graphing = true;

      var HEAP = this.HEAP;
      var hf = this.hf;
      var view = this.view;
      var lastPauseTime = Date.now();
      var minxd = this.view.minxd;
      var minyd = this.view.minyd;

      /**if (startingIndex === -1) {
        var xc1 = view.pointXtoCanvasX(x1);
        var yc1 = view.pointYtoCanvasY(y1);
        var xd = view.pointXtoCanvasX(x2) - xc1;
        var yd = view.pointYtoCanvasY(y2) - yc1;
        ctx.clearRect(xc1 + 0.5, yc1 + 0.5, xd + 0.5, yd + 0.5);
      }**/

      let x1t,x2t,y1t,y2t,xc1,yc1,xd,yd;

      var index = (startingIndex >= 0) ? startingIndex : 0;
      var depth = 0;

      if (hf(x1, x2, y1, y2)) {
        if (startingIndex === -1) {
          HEAP[0] = x1;
          HEAP[1] = x2;
          HEAP[2] = y1;
          HEAP[3] = y2;

          index += 4;
        }

        while (index >= 4) {
          if (index < 60) {
            if (Date.now() > lastPauseTime + 1000 / 60) {
              if (this.cancelGraph) {
                this.cancelGraph = false;
                return;
              }
              var that = this;
              setTimeout(function() {
                if (view.xmin !== x1 || view.xmax !== x2 || view.ymin !== y1 || view.ymax !== y2) {
                  that.graphing = false;
                  return;
                }
                that.asyncGraphRangeDFS(x1, x2, y1, y2, quality, callback, startingIndex = index);
              }, 5);
              return;
            }
          }

          y2t = HEAP[index - 1];
          y1t = HEAP[index - 2];
          x2t = HEAP[index - 3];
          x1t = HEAP[index - 4];

          if (hf(x1t, x2t, y1t, y2t)) {
            if (Math.abs(x1t - x2t) < quality * minxd) {
              if (Math.abs(y1t - y2t) < quality * minyd) {
                xc1 = view.pointXtoCanvasX(x1t);
                yc1 = view.pointYtoCanvasY(y1t);
                xd = Math.max(view.pointXtoCanvasX(x2t) - xc1, quality / 2, 1);
                yd = Math.max(view.pointYtoCanvasY(y2t) - yc1, quality / 2, 1);

                this.graphingCtx.ctx.fillRect(xc1 + 0.5, yc1 + 0.5, xd + 0.5, yd + 0.5);

                index -= 4;
              } else {
                index -= 4;

                HEAP[index] = x1t;
                HEAP[index + 1] = x2t;
                HEAP[index + 2] = y1t;
                HEAP[index + 3] = (y1t + y2t) / 2;
                HEAP[index + 4] = x1t;
                HEAP[index + 5] = x2t;
                HEAP[index + 6] = (y1t + y2t) / 2;
                HEAP[index + 7] = y2t;

                index += 8;
              }
            } else {
              if (Math.abs(y1t - y2t) < quality * minyd) {
                index -= 4;

                HEAP[index] = x1t;
                HEAP[index + 1] = (x1t + x2t) / 2;
                HEAP[index + 2] = y1t;
                HEAP[index + 3] = y2t;
                HEAP[index + 4] = (x1t + x2t) / 2;
                HEAP[index + 5] = x2t;
                HEAP[index + 6] = y1t;
                HEAP[index + 7] = y2t;

                index += 8;
              } else {
                index -= 4;

                HEAP[index] = x1t;
                HEAP[index + 1] = (x1t+x2t)/2;
                HEAP[index + 2] = y1t;
                HEAP[index + 3] = (y1t+y2t)/2;
                HEAP[index + 4] = (x1t+x2t)/2;
                HEAP[index + 5] = x2t;
                HEAP[index + 6] = (y1t+y2t)/2;
                HEAP[index + 7] = y2t;
                HEAP[index + 8] = x1t;
                HEAP[index + 9] = (x1t+x2t)/2;
                HEAP[index + 10] = (y1t+y2t)/2;
                HEAP[index + 11] = y2t;
                HEAP[index + 12] = (x1t+x2t)/2;
                HEAP[index + 13] = x2t;
                HEAP[index + 14] = y1t;
                HEAP[index + 15] = (y1t+y2t)/2;

                index += 16;
              }
            }
          } else {
            index -= 4;
          }
        }
      }

      this.graphing = false;

      if (callback) {
        callback();
      }
    }

    graph(quality = 1) {
      this.asyncGraphRangeDFS(this.view.xmin, this.view.xmax, this.view.ymin, this.view.ymax, quality);
    }

    cancelGraphing() {
      if (this.graphing) {
        this.cancelGraph = true;
      }
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
  exports.Interval = Interval;
  exports.GeneralFunction = GeneralFunction;

})));
