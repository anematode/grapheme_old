import { Expression } from '../core/GraphemeContext.js';

class Vector2 {
  constructor(x, y) {
    this.xc = x;
    this.yc = y;
  }

  get x() {
    return +this.xc;
  }

  get y() {
    return +this.yc;
  }

  set x(value) {
    this.xc = value;
  }

  set y(value) {
    this.yc = value;
  }

  copyFrom(vector) {
    this.xc = vector.xc;
    this.yc = vector.yc;
  }

  copyTo(vector) {
    vector.xc = this.xc;
    vector.yc = this.yc;
  }

  addFrom(vector, evaluate = false) {
    if (this.xc instanceof Expression || vector.xc instanceof Expression) {
      let xccopy = this.xc.bind({});
      this.xc = () => +xccopy + (+vector.xc);
    } else {
      this.xc += vector.xc;
    }

    if (this.yc instanceof Expression || vector.yc instanceof Expression) {
      let yccopy = this.yc.bind({});
      this.yc = () => +yccopy + (+vector.yc);
    } else {
      this.yc += vector.yc;
    }
  }

  addTo(vector) {
    if (vector.xc instanceof Expression || this.xc instanceof Expression) {
      let xccopy = vector.xc.bind({});
      vector.xc = () => +xccopy + (+this.xc);
    } else {
      vector.xc += this.xc;
    }

    if (vector.yc instanceof Expression || this.yc instanceof Expression) {
      let yccopy = vector.yc.bind({});
      vector.yc = () => +yccopy + (+this.yc);
    } else {
      vector.yc += this.yc;
    }
  }

  magnitude() {
    return Math.hypot(this.x, this.y);
  }
}
