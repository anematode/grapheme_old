let canvas = document.getElementsByTagName('canvas')[0];
let ctx = canvas.getContext('2d');

function updateCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = window.onresize = function() {
  updateCanvasDimensions();
}

var graphTimeout;

window.onmousewheel = function(evt) {
  try {
    clearTimeout(niceGraphTimer);
  } catch(e) {}

  graphingContext.clearCanvas();
  graphingContext.view.zoom(evt.offsetX, evt.offsetY, 1 + evt.deltaY / 1500, true);
  graphingContext.graphAll(6);

  niceGraphTimer = setTimeout(function() {
    graphingContext.clearCanvas();
    graphingContext.graphAll(1);
  }, 200);
}

var lastScrollTime = 0;

var mousedown, prevMouseX, prevMouseY;

window.onmousedown = function(evt) {
  prevMouseX = evt.offsetX;
  prevMouseY = evt.offsetY;

  mousedown = true;
}

var niceGraphTimer = null;

window.onmousemove = function(evt) {
  if (mousedown) {
    try {
      clearTimeout(niceGraphTimer);
    } catch(e) {}

    graphingContext.clearCanvas();
    graphingContext.view.translate(evt.offsetX - prevMouseX, evt.offsetY - prevMouseY, true);

    prevMouseX = evt.offsetX;
    prevMouseY = evt.offsetY;

    graphingContext.graphAll(6);

    niceGraphTimer = setTimeout(function() {
      graphingContext.clearCanvas();
      graphingContext.graphAll(1);
    }, 200);
  }
}

window.onmouseup = function(evt) {
  mousedown = false;
}

let graphingContext = new Grapheme.GraphingContext(canvas, ctx);

graphingContext.addEquation(Grapheme.ASTFromStringFunc("ADD(SQ(x&),MUL(-1&,y&))"))
graphingContext.addEquation(Grapheme.ASTFromStringFunc("ADD(TAN(x&),MUL(-1&,y&))"))
