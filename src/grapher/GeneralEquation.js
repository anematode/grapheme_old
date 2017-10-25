class GeneralEquation {
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

class GeneralInequality {
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

export {GeneralEquation, GeneralInequality};
