let canvas = document.getElementsByTagName('canvas')[0];
let ctx = canvas.getContext('2d');

function updateCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = window.onresize = updateCanvasDimensions;

window.onmousewheel = function(evt) {
  graphingContext.clearCanvas();
  graphingContext.view.zoom(evt.offsetX, evt.offsetY, evt.deltaY, true);
  graphingContext.graphAll();
}

window.onclick = function(evt) {

}

let graphingContext = new Grapheme.GraphingContext(canvas, ctx);
let func1 = function(x) {
  return x * x;
}
let func2 = Math.sin;

graphingContext.addFunction(func1);
graphingContext.addFunction(func2);
