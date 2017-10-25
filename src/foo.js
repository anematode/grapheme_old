class Test {
  constructor(x,y) {
    this.x = x;
    this.y = y;
  }

  method() {
    return Math.hypot(this.x, this.y);
  }
}

export { Test };
