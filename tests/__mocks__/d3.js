// Mock D3 for testing
const d3Mock = {
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => d3Mock.select()),
            style: jest.fn(() => d3Mock.select()),
            text: jest.fn(() => d3Mock.select()),
            merge: jest.fn(() => d3Mock.select()),
            on: jest.fn(() => d3Mock.select())
          })),
          merge: jest.fn(() => d3Mock.select())
        })),
        exit: jest.fn(() => ({
          remove: jest.fn(() => d3Mock.select())
        })),
        attr: jest.fn(() => d3Mock.select()),
        style: jest.fn(() => d3Mock.select()),
        text: jest.fn(() => d3Mock.select()),
        on: jest.fn(() => d3Mock.select()),
        merge: jest.fn(() => d3Mock.select())
      })),
      attr: jest.fn(() => d3Mock.select()),
      style: jest.fn(() => d3Mock.select()),
      text: jest.fn(() => d3Mock.select()),
      on: jest.fn(() => d3Mock.select()),
      merge: jest.fn(() => d3Mock.select())
    })),
    append: jest.fn(() => ({
      attr: jest.fn(() => d3Mock.select()),
      style: jest.fn(() => d3Mock.select()),
      text: jest.fn(() => d3Mock.select()),
      merge: jest.fn(() => d3Mock.select()),
      on: jest.fn(() => d3Mock.select())
    })),
    attr: jest.fn(() => d3Mock.select()),
    style: jest.fn(() => d3Mock.select()),
    text: jest.fn(() => d3Mock.select()),
    on: jest.fn(() => d3Mock.select()),
    merge: jest.fn(() => d3Mock.select()),
    node: jest.fn(() => ({
      getBoundingClientRect: jest.fn(() => ({ width: 800, height: 400 }))
    }))
  })),
  
  dispatch: jest.fn(() => ({
    on: jest.fn(() => d3Mock.dispatch()),
    call: jest.fn()
  })),
  
  scaleLinear: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleLinear()),
    range: jest.fn(() => d3Mock.scaleLinear()),
    nice: jest.fn(() => d3Mock.scaleLinear()),
    clamp: jest.fn(() => d3Mock.scaleLinear()),
    ticks: jest.fn(() => [0, 10, 20, 30, 40, 50])
  })),
  
  scaleBand: jest.fn(() => {
    const bandMock = {
      _domain: [],
      domain: function(domain) {
        if (arguments.length) {
          this._domain = domain;
          return this;
        }
        return this._domain;
      },
      range: jest.fn(() => bandMock),
      padding: jest.fn(() => bandMock),
      paddingInner: jest.fn(() => bandMock),
      paddingOuter: jest.fn(() => bandMock),
      align: jest.fn(() => bandMock),
      bandwidth: jest.fn(() => 50)
    };
    return bandMock;
  }),
  
  // Advanced scales
  scaleTime: jest.fn(() => {
    const timeMock = {
      _domain: [],
      domain: function(domain) {
        if (arguments.length) {
          this._domain = domain;
          return this;
        }
        return this._domain;
      },
      range: jest.fn(() => timeMock),
      nice: jest.fn(() => timeMock),
      ticks: jest.fn(() => []),
      tickFormat: jest.fn()
    };
    return timeMock;
  }),
  
  scaleOrdinal: jest.fn(() => {
    const ordinalMock = {
      _domain: [],
      domain: function(domain) {
        if (arguments.length) {
          this._domain = domain;
          return this;
        }
        return this._domain;
      },
      range: jest.fn(() => ordinalMock),
      unknown: jest.fn(() => ordinalMock)
    };
    return ordinalMock;
  }),
  
  scalePow: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scalePow()),
    range: jest.fn(() => d3Mock.scalePow()),
    exponent: jest.fn(() => d3Mock.scalePow()),
    nice: jest.fn(() => d3Mock.scalePow())
  })),
  
  scaleLog: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleLog()),
    range: jest.fn(() => d3Mock.scaleLog()),
    base: jest.fn(() => d3Mock.scaleLog()),
    nice: jest.fn(() => d3Mock.scaleLog())
  })),
  
  scaleSequential: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleSequential()),
    interpolator: jest.fn(() => d3Mock.scaleSequential())
  })),
  
  scaleQuantile: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleQuantile()),
    range: jest.fn(() => d3Mock.scaleQuantile())
  })),
  
  scaleThreshold: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleThreshold()),
    range: jest.fn(() => d3Mock.scaleThreshold())
  })),
  
  // Brush functions
  brushX: jest.fn(() => ({
    extent: jest.fn(() => d3Mock.brushX()),
    on: jest.fn(() => d3Mock.brushX()),
    move: jest.fn()
  })),
  
  brushY: jest.fn(() => ({
    extent: jest.fn(() => d3Mock.brushY()),
    on: jest.fn(() => d3Mock.brushY()),
    move: jest.fn()
  })),
  
  brush: jest.fn(() => ({
    extent: jest.fn(() => d3Mock.brush()),
    on: jest.fn(() => d3Mock.brush()),
    move: jest.fn()
  })),
  
  axisBottom: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisBottom()),
    tickFormat: jest.fn(() => d3Mock.axisBottom()),
    tickSize: jest.fn(() => d3Mock.axisBottom())
  })),
  
  axisLeft: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisLeft()),
    tickFormat: jest.fn(() => d3Mock.axisLeft()),
    tickSize: jest.fn(() => d3Mock.axisLeft())
  })),
  
  format: jest.fn(() => jest.fn(d => d.toString())),
  
  easeQuadInOut: jest.fn(),
  
  max: jest.fn((arr, accessor) => {
    if (accessor) {
      return Math.max(...arr.map(accessor));
    }
    return Math.max(...arr);
  }),
  
  min: jest.fn((arr, accessor) => {
    if (accessor) {
      return Math.min(...arr.map(accessor));
    }
    return Math.min(...arr);
  }),
  
  extent: jest.fn((arr, accessor) => {
    if (accessor) {
      const values = arr.map(accessor);
      return [Math.min(...values), Math.max(...values)];
    }
    return [Math.min(...arr), Math.max(...arr)];
  }),
  
  // Additional utility functions
  sum: jest.fn((arr, accessor) => {
    if (accessor) {
      return arr.map(accessor).reduce((a, b) => a + b, 0);
    }
    return arr.reduce((a, b) => a + b, 0);
  }),
  
  mean: jest.fn((arr, accessor) => {
    if (accessor) {
      const values = arr.map(accessor);
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }),
  
  // Axis generators with enhanced features
  axisBottom: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisBottom()),
    tickFormat: jest.fn(() => d3Mock.axisBottom()),
    tickSize: jest.fn(() => d3Mock.axisBottom())
  })),
  
  axisLeft: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisLeft()),
    tickFormat: jest.fn(() => d3Mock.axisLeft()),
    tickSize: jest.fn(() => d3Mock.axisLeft())
  })),
  
  axisTop: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisTop()),
    tickFormat: jest.fn(() => d3Mock.axisTop()),
    tickSize: jest.fn(() => d3Mock.axisTop())
  })),
  
  axisRight: jest.fn(() => ({
    ticks: jest.fn(() => d3Mock.axisRight()),
    tickFormat: jest.fn(() => d3Mock.axisRight()),
    tickSize: jest.fn(() => d3Mock.axisRight())
  })),
  
  // Time formatting
  timeFormat: jest.fn(() => jest.fn(date => date.toISOString())),
  
  // Color schemes
  schemeCategory10: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"],
  schemeBlues: [
    ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6"],
    ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]
  ],
  
  // Interpolators
  interpolateBlues: jest.fn(t => `rgb(${Math.floor(255 * (1 - t))}, ${Math.floor(255 * (1 - t))}, 255)`)
};

module.exports = d3Mock;
