import { GraphemeContext } from './GraphemeContext.js';

class Widget {
  constructor(x, y, width, height, parent, parentIndex) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.parent = parent ? parent : null;
    this.parentIndex = (parentIndex !== undefined) ? parentIndex : null;
  }

  scale(factor) {
    this.width *= factor;
    this.height *= factor;
  }

  translate(x,y) {
    this.x += x;
    this.y += y;
  }

  setParent(parent) {
    if (parent instanceof GraphemeContext) {
      this.parent = parent;
    }
  }

  setParentIndex(index) {
    if (index >= 0) {
      this.parentIndex = index;
    }
  }
}

class TestWidget extends Widget {
  constructor(x, y, width, height, parent, parentIndex) {
    super(x, y, width, height, parent, parentIndex);
    this.testValue = "udder";
  }

  method(x) {
    return x*x;
  }
}

export {Widget, TestWidget};
