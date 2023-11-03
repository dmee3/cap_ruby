class ChartColor {
  r: number
  g: number
  b: number

  constructor(red: number, green: number, blue: number) {
    this.r = red
    this.g = green
    this.b = blue
  }

  static red() {
    return new ChartColor(220, 38, 38)
  }
  static orange() {
    return new ChartColor(255, 159, 64)
  }
  static yellow() {
    return new ChartColor(255, 205, 86)
  }
  static green() {
    return new ChartColor(5, 150, 105)
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
  static white() {
    return new ChartColor(255, 255, 255)
  }

  rgb() {
    return this.r + ',' + this.g + ',' + this.b
  }

  rgbString(): string {
    return 'rgba(' + this.rgb() + ',1)'
  }
}

export default ChartColor
