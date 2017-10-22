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

let canvas = document.getElementsByTagName('canvas')[0];
let ctx = canvas.getContext('2d');

function updateCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = window.onresize = updateCanvasDimensions;

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
  }
}

function hf(x1, x2, y1, y2) {
  let intervals = Interval.ADD(Interval.DIV([x1, x2]), Interval.MUL([-1, -1], [y1, y2]));
  for (let i = 0; i < intervals.length; i += 2) {
    if (intervals[i] <= 0 && intervals[i + 1] >= 0) {
      return true;
    }
  }
  return false;
}

var view = new ViewWindow(canvas, -5, 5, -5, 5);

window.onmousewheel = function(evt) {
  clearCanvas();
  view.zoom(evt.offsetX, evt.offsetY, 1 + evt.deltaY / 1500, true);
  graph();
}

var mousedown, prevMouseX, prevMouseY;

window.onmousedown = function(evt) {
  prevMouseX = evt.offsetX;
  prevMouseY = evt.offsetY;

  mousedown = true;
}

window.onmousemove = function(evt) {
  if (mousedown) {
    clearCanvas();
    view.translate(evt.offsetX - prevMouseX, evt.offsetY - prevMouseY, true);

    prevMouseX = evt.offsetX;
    prevMouseY = evt.offsetY;
    graph();
  }
}

window.onmouseup = function(evt) {
  mousedown = false;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function recurse(x1, x2, y1, y2, depth = 0) {
  if (depth > 15) {
    return;
  }
  if (hf(x1, x2, y1, y2)) {
    if (Math.abs(x1 - x2) < view.minxd) {
      if (Math.abs(y1 - y2) < view.minyd) {
        let xc1 = view.pointXtoCanvasX(x1);
        let yc1 = view.pointYtoCanvasY(y1);
        let xd = Math.max(view.pointXtoCanvasX(x2) - xc1, 1);
        let yd = Math.max(view.pointYtoCanvasY(y2) - yc1, 1);
        ctx.fillRect(xc1 + 0.5, yc1 + 0.5, xd + 0.5, yd + 0.5);
      } else {
        recurse(x1, (x1 + x2) / 2, y1, y2, depth + 1);
        recurse((x1 + x2) / 2, x2, y1, y2, depth + 1);
        return;
      }
    } else {
      if (Math.abs(y1 - y2) < view.minyd) {
        recurse(x1, x2, y1, (y1 + y2) / 2, depth + 1);
        recurse(x1, x2, (y1 + y2) / 2, y2, depth + 1);
        return;
      }
      recurse(x1, (x1 + x2) / 2, y1, (y1 + y2) / 2, depth + 1);
      recurse(x1, (x1 + x2) / 2, (y1 + y2) / 2, y2, depth + 1);
      recurse((x1 + x2) / 2, x2, y1, (y1 + y2) / 2, depth + 1);
      recurse((x1 + x2) / 2, x2, (y1 + y2) / 2, y2, depth + 1);
    }
  }
}

function graph() {
  recurse(view.xmin, view.xmax, view.ymin, view.ymax);
}
