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
    nice: jest.fn(() => d3Mock.scaleLinear())
  })),
  
  scaleBand: jest.fn(() => ({
    domain: jest.fn(() => d3Mock.scaleBand()),
    range: jest.fn(() => d3Mock.scaleBand()),
    padding: jest.fn(() => d3Mock.scaleBand()),
    bandwidth: jest.fn(() => 50)
  })),
  
  axisBottom: jest.fn(() => jest.fn()),
  axisLeft: jest.fn(() => jest.fn()),
  
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
  })
};

module.exports = d3Mock;
