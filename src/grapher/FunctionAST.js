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
    return Function(this.flatten());
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

export {Operator, OPS, FunctionAST, ASTNode, isASTConstant, ASTConstantValue, ASTFromStringFunc};
