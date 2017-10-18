let canvas = document.getElementsByTagName('canvas')[0];
let ctx = canvas.getContext('2d');

function updateCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = window.onresize = function() {
  updateCanvasDimensions();
  graphingContext.graphAll();
}

window.onmousewheel = function(evt) {
  graphingContext.clearCanvas();
  graphingContext.view.zoom(evt.offsetX, evt.offsetY, 1 + evt.deltaY / 1500, true);
  graphingContext.graphAll();
}

var mousedown, prevMouseX, prevMouseY;

window.onmousedown = function(evt) {
  prevMouseX = evt.offsetX;
  prevMouseY = evt.offsetY;

  mousedown = true;
}

window.onmousemove = function(evt) {
  if (mousedown) {
    graphingContext.clearCanvas();
    graphingContext.view.translate(evt.offsetX - prevMouseX, evt.offsetY - prevMouseY, true);

    prevMouseX = evt.offsetX;
    prevMouseY = evt.offsetY;
    graphingContext.graphAll();
  }
}

window.onmouseup = function(evt) {
  mousedown = false;
}

let graphingContext = new Grapheme.GraphingContext(canvas, ctx);
let func1 = function(x) {
  return x * x;
}
let func2 = x => x*x*x;
let func3 = x => 0;

for (let j = 0; j < 2; j += 0.1) {
  graphingContext.addFunction(function(x) {
    return Math.sin(x + j) + 4 * j;
  });
}

graphingContext.addFunction(func1);
graphingContext.addFunction(func2);
graphingContext.addFunction(func3);
