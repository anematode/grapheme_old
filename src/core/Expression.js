import { GraphemeContext } from './GraphemeContext.js';

class Expression {
  constructor(func, varnames, parent) {
    if (parent && parent instanceof GraphemeContext) {
      this.parent = parent;
    }

    this.func = func;
    this.varnames = varnames;
  }

  setParent(parent) {
    if (parent && parent instanceof GraphemeContext) {
      this.parent = parent;
    } else {
      console.error('Parent not instance of Grapheme.Activity.');
    }
  }

  evaluate() {
    return this.func.apply(null, this.varnames.map(v => this.parent.variables[v]));
  }

  valueOf() {
    return this.func.apply(null, this.varnames.map(v => this.parent.variables[v]));
  }
}

export { Expression };
