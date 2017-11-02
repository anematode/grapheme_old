class StaticDataset {
  constructor(data, floatArray = false, floatArrayType = Float64Array) {
    for (let i = 0; i < args.length; i++) {
      if (typeof data[i] !== "number") {
        return;
      }
    }

    if (floatArray) {
      this.array = new floatArrayType(data);
    } else {
      this.array = data;
    }

    this.size = this.array.length;
    this.props = {};
  }

  sum(memoize = true) {
    if (this.props.sum !== undefined) return this.props.sum;

    let s = 0;
    for (let i = 0; i < this.size; i++) {
      s += this.array[i];
    }

    if (memoize) this.array.sum = s;
    return s;
  }

  mean(memoize = true) {
    if (this.props.mean !== undefined) return this.props.mean;

    let m = this.sum() / this.size;
    if (memoize) this.props.mean = m;
    return m;
  }

  stddev(besselCorrected = false, memoize = true) {
    if (besselCorrected && this.props.besselCorrectedStdDev !== undefined) {
      return this.props.besselCorrectedStdDev;
    } else if (!besselCorrected && this.props.besselUncorrectedStdDev !== undefined) {
      return this.props.besselUncorrectedStdDev;
    }

    let s = 0;
    let m = this.mean();
    let arr = this.array;

    for (let i = 0; i < this.size; i++) {
      s += (arr[i] - m) * (arr[i] - m);
    }

    s /= this.size - besselCorrected;
    s = Math.sqrt(s);

    if (memoize) {
      if (besselCorrected) {
        this.props.besselCorrectedStdDev = s;
      } else if (!besselCorrected && this.props.besselUncorrectedStdDev !== undefined) {
        this.props.besselUncorrectedStdDev = s;
      }
    }

    return s;
  }
}

export { StaticDataset };
