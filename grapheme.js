(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Grapheme = global.Grapheme || {})));
}(this, (function (exports) {

  // Internals

  const DEFAULTANGLETHRESHOLD = 0.01;
  const MAXRECURSION = 30;

  function fastATAN(y, x) {
    // Fast version of atan2, returning results in taxicab angle format

    return (y >= 0 ? (x >= 0 ? y/(x+y) : 1-x/(-x+y)) : (x < 0 ? 2-y/(-x-y) : 3+x/(x-y)));
  }

  function highAngle(y1, x1, y2, x2, angleThreshold = DEFAULTANGLETHRESHOLD) {
    // Tests if an angle between two points and the origin is too large

    return (Math.abs(fastATAN(y1, x1) - fastATAN(-y2, -x2)) > angleThreshold);
  }

  // Exports

  class ViewWindow {
    constructor(parentCanvas, xmin, xmax, ymin, ymax) {
      this.parentCanvas = parentCanvas;

      this.xmin = xmin || -5;
      this.xmax = xmax || 5;
      this.ymin = ymin || -5;
      this.ymax = ymax || 5;

      this.xdelta = this.xmax - this.xmin;
      this.ydelta = this.ymax - this.ymin;
    }

    copyFrom(viewWindow) {
      this.xmax = viewWindow.xmax;
      this.xmin = viewWindow.xmin;
      this.ymax = viewWindow.ymax;
      this.ymin = viewWindow.ymin;

      this.xdelta = viewWindow.xdelta;
      this.ydelta = viewWindow.ydelta;
    }

    copyTo(viewWindow) {
      viewWindow.xmax = this.xmax;
      viewWindow.xmin = this.xmin;
      viewWindow.ymax = this.ymax;
      viewWindow.ymin = this.ymin;

      viewWindow.xdelta = this.xdelta;
      viewWindow.ydelta = this.ydelta;
    }

    correctDeltas() {
      this.xdelta = this.xmax - this.xmin;
      this.ydelta = this.ymax - this.ymin;
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

    translate(x, y, screenCoords = false) {
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
      if (screenCoords) {
        x = this.canvasXtoPointX(x);
        y = this.canvasYtoPointY(y);
      }

      zoomFactor = 1 + zoomFactor / 500;

      this.xmin = zoomFactor * (this.xmin - x) + x;
      this.xmax = zoomFactor * (this.xmax - x) + x;
      this.ymin = zoomFactor * (this.ymin - y) + y;
      this.ymax = zoomFactor * (this.ymax - y) + y;

      this.correctDeltas();
    }

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
        this.angleThreshold = 0.02;
        this.epsilon = 1e-6;
        this.density = 400;

        this.view = new ViewWindow(this.canvas, -5, 5, -5, 5);
      }

      this.view.xdelta = this.view.xmax - this.view.xmin;
      this.view.ydelta = this.view.ymax - this.view.ymin;
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

  class ContinuousFunction {
    constructor(func, graphingCtx) {
      this.func = eval(func);
      this.graphingCtx = graphingCtx;
      this.view = graphingCtx.view;
      this.canvas = graphingCtx.canvas;

      this.DENSITY = 200;
      this.EPSILON = 1e-6;
      this.MAXRECURSION = 50;

      this.FUDGE = 10;
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

    asyncGraph(xstart, xend, xjump, callback) {

    }
  }

  exports.ViewWindow = ViewWindow;
  exports.GraphingContext = GraphingContext;
  exports.ContinuousFunction = ContinuousFunction;
})));
