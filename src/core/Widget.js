import { Activity } from './Activity.js';

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
    if (parent && parent instanceof Activity) {
      this.parent = parent;

      this.ctx = parent.ctx;
      this.canvas = parent.canvas;
    } else {
      console.error('Parent not instance of Grapheme.Activity.');
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
  }

  render() {
    if (this.ctx) {
      this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

export {Widget, TestWidget};
