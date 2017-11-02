import {FunctionAST} from './FunctionAST.js';
import {GeneralEquation, GeneralInequality} from './GeneralEquation.js';
import {Widget} from '../core/Widget.js';

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

class GraphingWidget {
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
    if (ast instanceof GeneralEquation) {
      this.functions.push(ast);
    } else if (ast instanceof Function) {
      this.functions.push(new GeneralEquation(ast, this));
    } else if (ast instanceof FunctionAST) {
      this.functions.push(new GeneralEquation(ast.compilehf(), this));
    }
  }

  cancelGraphing() {
    for (let i = 0; i < this.functions.length; i++) {
      this.functions[i].cancelGraphing();
    }
  }
}

export {ViewWindow, GraphingWidget};
