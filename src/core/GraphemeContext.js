class GraphemeContext {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx || canvas.getContext('2d');

    this.widgets = [];
    this.variables = {};
    this.functions = [];
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  render(timelimit = 1000 / 60) {
    // Render all widgets within a certain time limit; if time limit passed, return false, otherwise return true.
    if (timelimit) {
      var start = Date.now();
      this.renderBackground();
      if (Date.now() - start > timelimit) return false;
      for (let i = 0; i < this.widgets.length; i++) {
        this.widgets[i].render();
        if (Date.now() - start > timelimit) {
          return false;
        }
      }
      return true;
    } else {
      for (let i = 0; i < this.widgets.length; i++) {
        this.widgets[i].render();
      }
    }
  }

  get widgetCount() {
    return this.widgets.length;
  }

  addWidget(widget) {
    widget.setParent(this);
    this.widgets.push(widget);

    this.updateWidgetIndices();
  }

  destroyWidget(index) {
    if (index >= this.widgets.length) return;

    this.widgets[index].destroyChildren();
    this.widgets.splice(index, 1);

    this.updateWidgetIndices();
  }

  updateWidgetIndices() {
    for (let i = 0; i < this.widgets.length; i++) {
      this.widgets[i].setParentIndex(i);
    }
  }

  bringToTop(index) {
    if (index >= this.widgets.length) return;
    let movedElement = this.widgets[index];

    for (let i = index; )
  }
}
