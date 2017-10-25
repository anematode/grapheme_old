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

export {Interval};
