class ViewWindow {
  // This class implements an abstraction for a viewing area, storing xmin, xmax, ymin, and ymax

  constructor(parentCanvas, xmin, xmax, ymin, ymax) {
    this.parentCanvas = parentCanvas;

    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
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

  get xdelta() {
    return this.xmax - this.xmin;
  }

  get ydelta() {
    return this.ymax - this.ymin;
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
  },
  ABS: function(m2) {
    let k = [];
    for (let i = 0; i < m2.length; i++) {
      if (m2[i] === 0 && m2[i + 1] === 0) {
        k.push(0);
        k.push(0);
      } else if (m2[i] <= 0 && m2[i + 1] >= 0) {
        k.push(0);
        k.push(Math.max(Math.abs(m2[i]), Math.abs([i+1])));
        continue;
      } else {
        k.push(Math.min(Math.abs(m2[i]), Math.abs([i+1])));
        k.push(Math.max(Math.abs(m2[i]), Math.abs([i+1])));
      }
    }
    return k;
  },
  SGN: function(m2) {
    let k = [];
    for (let i = 0; i < m2.length; i++) {
      if (m2[i] < 0) {
        k.push(-1);
        k.push(-1);
      }
      if (m2[i + 1] > 0) {
        k.push(1);
        k.push(1);
      }
      if (m2[i] <= 0 && m2[i + 1] >= 0) {
        k.push(0);
        k.push(0);
      }
    }
    return k;
  },
  SIN: function(m2) {
    let k = [];
    let smin, smax;
    for (let i = 0; i < m2.length; i += 2) {
      if (m2[i + 1] - m2[i] >= 2 * Math.PI) {
        k.push(-1);
        k.push(1);
        continue;
      }
      smin = 2 * Math.PI * Math.floor((m2[i] + Math.PI / 2) / (2 * Math.PI)) + 3 * Math.PI / 2;
      smax = 2 * Math.PI * Math.floor((m2[i] + 3 * Math.PI / 2) / (2 * Math.PI)) + Math.PI / 2;
      if (m2[i] <= smin && smin <= m2[i + 1]) {
        if (m2[i] <= smax && smax <= m2[i + 1]) {
          k.push(-1);
          k.push(1);
          continue;
        }
        k.push(-1);
        k.push(Math.max(Math.sin(m2[i]), Math.sin(m2[i + 1])));
      } else {
        if (m2[i] <= smax && smax <= m2[i + 1]) {
          k.push(Math.min(Math.sin(m2[i]), Math.sin(m2[i + 1])));
          k.push(1);
          continue;
        }
        k.push(Math.min(Math.sin(m2[i]), Math.sin(m2[i + 1])));
        k.push(Math.max(Math.sin(m2[i]), Math.sin(m2[i + 1])));
      }
    }
    return k;
  },
  COS: function(m2) {
    let k = [];
    let smin, smax;
    for (let i = 0; i < m2.length; i += 2) {
      if (m2[i + 1] - m2[i] >= 2 * Math.PI) {
        k.push(-1);
        k.push(1);
        continue;
      }
      smin = 2 * Math.PI * Math.floor((m2[i] + Math.PI) / (2 * Math.PI)) + Math.PI;
      smax = 2 * Math.PI * Math.floor(m2[i] / (2 * Math.PI)) + 2 * Math.PI;
      if (m2[i] <= smin && smin <= m2[i + 1]) {
        if (m2[i] <= smax && smax <= m2[i + 1]) {
          k.push(-1);
          k.push(1);
          continue;
        }
        k.push(-1);
        k.push(Math.max(Math.cos(m2[i]), Math.cos(m2[i + 1])));
      } else {
        if (m2[i] <= smax && smax <= m2[i + 1]) {
          k.push(Math.min(Math.cos(m2[i]), Math.cos(m2[i + 1])));
          k.push(1);
          continue;
        }
        k.push(Math.min(Math.cos(m2[i]), Math.cos(m2[i + 1])));
        k.push(Math.max(Math.cos(m2[i]), Math.cos(m2[i + 1])));
      }
    }
    return k;
  },
  TAN: function(m2) {
    let k = [];
    let asympt;
    for (let i = 0; i < m2.length; i += 2) {
      if (m2[i + 1] - m2[i] >= Math.PI) {
        k.push(-Infinity);
        k.push(Infinity);
        continue;
      }
      asympt = Math.PI * Math.floor((m2[i] + Math.PI / 2) / Math.PI) + Math.PI / 2;
      if (m2[i] <= asympt && asympt <= m2[i + 1]) {
        k.push(Math.tan(m2[i]));
        k.push(Infinity);
        k.push(-Infinity);
        k.push(Math.tan(m2[i+1]));
      } else {
        k.push(Math.tan(m2[i]));
        k.push(Math.tan(m2[i+1]));
      }
    }
    return k;
  },
  CSC: function(m2) {

  }
}

function hf(x1, x2, y1, y2) {
  let intervals = Interval.ADD(Interval.MUL([-1, -1], Interval.COS(Interval.MUL([x1, x2], Interval.SIN([x1, x2])))),
    Interval.SIN(Interval.ADD(Interval.SIN([x1, x2]), Interval.COS([y1, y2]))));
  for (let i = 0; i < intervals.length; i += 2) {
    if (intervals[i] <= 0 && intervals[i + 1] >= 0) {
      return true;
    }
  }
  return false;
}

var view = new ViewWindow(canvas, -5, 5, -5, 5);
var lastScrollTime = 0;

window.onmousewheel = function(evt) {
  lastScrollTime = Date.now();

  try {
    clearTimeout(nextGraphTimeout);
  } catch (e) {

  }

  clearCanvas();
  view.zoom(evt.offsetX, evt.offsetY, 1 + evt.deltaY / 1500, true);
  graph();

  nextGraphTimeout = setTimeout(graph, 201);
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

var HEAP = new Float32Array(500);

function graphRange(x1, x2, y1, y2, quality = 1, startingIndex = -1) {
  if (startingIndex === -1) {
    var xc1 = view.pointXtoCanvasX(x1);
    var yc1 = view.pointYtoCanvasY(y1);
    var xd = view.pointXtoCanvasX(x2) - xc1;
    var yd = view.pointYtoCanvasY(y2) - yc1;
    ctx.clearRect(xc1 + 0.5, yc1 + 0.5, xd + 0.5, yd + 0.5);
  }

  let x1t,x2t,y1t,y2t;

  var index = (startingIndex >= 0) ? startingIndex : 0;

  if (hf(x1, x2, y1, y2)) {
    if (startingIndex === -1) {
      HEAP[0] = x1;
      HEAP[1] = x2;
      HEAP[2] = y1;
      HEAP[3] = y2;

      index += 4;
    }

    while (index >= 4) {

      if (index < 40) {
        if (Date.now() > lastPauseTime + 1000 / 60) {
          lastPauseTime = Date.now();
          setTimeout(function() {
            if (view.xmin !== x1 || view.xmax !== x2 || view.ymin !== y1 || view.ymax !== y2) {
              return;
            }
            graphRange(x1, x2, y1, y2, quality, startingIndex = index);
          }, 5);
          return;
        }
      }

      y2t = HEAP[index - 1];
      y1t = HEAP[index - 2];
      x2t = HEAP[index - 3];
      x1t = HEAP[index - 4];

      if (hf(x1t, x2t, y1t, y2t)) {
        if (Math.abs(x1t - x2t) < quality * view.minxd) {
          if (Math.abs(y1t - y2t) < quality * view.minyd) {
            xc1 = view.pointXtoCanvasX(x1t);
            yc1 = view.pointYtoCanvasY(y1t);
            xd = Math.max(view.pointXtoCanvasX(x2t) - xc1, quality / 2, 1);
            yd = Math.max(view.pointYtoCanvasY(y2t) - yc1, quality / 2, 1);

            ctx.fillRect(xc1 + 0.5, yc1 + 0.5, xd + 0.5, yd + 0.5);

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
          if (Math.abs(y1t - y2t) < quality * view.minyd) {
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
}

var lastPauseTime = 0;
var nextGraphTimeout = null;

function graph() {
  lastPauseTime = Date.now();

  var prevxmin = view.xmin;
  var prevxmax = view.xmax;
  var prevymin = view.ymin;
  var prevymax = view.ymax;

  if (lastPauseTime < lastScrollTime + 200) {
    graphRange(view.xmin, view.xmax, view.ymin, view.ymax, 24);
  } else {
    graphRange(view.xmin, view.xmax, view.ymin, view.ymax, 1);
  }
}
