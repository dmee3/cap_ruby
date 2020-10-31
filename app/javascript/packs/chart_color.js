export default class ChartColor {
  constructor(r, g, b) {
    this.r = r
    this.g = g
    this.b = b
  }

  static red() {
    return new ChartColor(255, 99, 132)
  }
  static orange() {
    return new ChartColor(255, 159, 64)
  }
  static yellow() {
    return new ChartColor(255, 205, 86)
  }
  static green() {
    return new ChartColor(84, 230, 119)
  }
  static blue() {
    return new ChartColor(54, 162, 235)
  }
  static purple() {
    return new ChartColor(153, 102, 255)
  }
  static grey() {
    return new ChartColor(201, 203, 207)
  }

  rgb() {
    return this.r + ',' + this.g + ',' + this.b
  }

  rgbaString(a) {
    a = typeof a !== 'undefined' ? a : 1
    return 'rgba(' + this.rgb() + ',' + a + ')'
  }
}
