let canvas = document.getElementsByTagName('canvas')[0];
let ctx = canvas.getContext('2d');

function updateCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = window.onresize = function() {
  updateCanvasDimensions();
}

let context = new Grapheme.GraphemeContext(canvas, ctx);
context.variables = {a: 4, b: 5};
j = new Grapheme.Expression((a,b) => (a * a + b), ['a', 'b'], context);

function update() {
  requestAnimationFrame(update);
}

update();
