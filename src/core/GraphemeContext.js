class GraphemeContext {
  constructor(activities, vars, props) {
    this.activities = activities || [];
    this.vars = vars || {};
    this.props = props || {};
  }

  addActivity(activity) {
    activity.setParent(this);
    this.activities.push(activity);
    this.updateActivityIndices();
  }

  get activityCount() {
    return this.activities.length;
  }

  destroyActivity(index) {
    if (index >= this.activities.length) return;

    this.activities[index].destroyChildren();
    this.activities.splice(index, 1);

    this.updateWidgetIndices();
  }

  updateActivityIndices() {
    for (let i = 0; i < this.activities.length; i++) {
      this.activities[i].setParentIndex(i);
    }
  }
}

export { GraphemeContext };
