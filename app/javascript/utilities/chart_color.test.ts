import { describe, it, expect } from 'vitest'
import ChartColor from './chart_color'

describe('ChartColor', () => {
  describe('constructor', () => {
    it('creates a color with RGB values', () => {
      const color = new ChartColor(100, 150, 200)
      expect(color.r).toBe(100)
      expect(color.g).toBe(150)
      expect(color.b).toBe(200)
    })

    it('handles zero values', () => {
      const color = new ChartColor(0, 0, 0)
      expect(color.r).toBe(0)
      expect(color.g).toBe(0)
      expect(color.b).toBe(0)
    })

    it('handles maximum RGB values', () => {
      const color = new ChartColor(255, 255, 255)
      expect(color.r).toBe(255)
      expect(color.g).toBe(255)
      expect(color.b).toBe(255)
    })
  })

  describe('static color methods', () => {
    it('creates red color', () => {
      const color = ChartColor.red()
      expect(color.r).toBe(220)
      expect(color.g).toBe(38)
      expect(color.b).toBe(38)
    })

    it('creates orange color', () => {
      const color = ChartColor.orange()
      expect(color.r).toBe(255)
      expect(color.g).toBe(159)
      expect(color.b).toBe(64)
    })

    it('creates yellow color', () => {
      const color = ChartColor.yellow()
      expect(color.r).toBe(255)
      expect(color.g).toBe(205)
      expect(color.b).toBe(86)
    })

    it('creates green color', () => {
      const color = ChartColor.green()
      expect(color.r).toBe(5)
      expect(color.g).toBe(150)
      expect(color.b).toBe(105)
    })

    it('creates blue color', () => {
      const color = ChartColor.blue()
      expect(color.r).toBe(54)
      expect(color.g).toBe(162)
      expect(color.b).toBe(235)
    })

    it('creates purple color', () => {
      const color = ChartColor.purple()
      expect(color.r).toBe(153)
      expect(color.g).toBe(102)
      expect(color.b).toBe(255)
    })

    it('creates grey color', () => {
      const color = ChartColor.grey()
      expect(color.r).toBe(201)
      expect(color.g).toBe(203)
      expect(color.b).toBe(207)
    })

    it('creates white color', () => {
      const color = ChartColor.white()
      expect(color.r).toBe(255)
      expect(color.g).toBe(255)
      expect(color.b).toBe(255)
    })
  })

  describe('rgb()', () => {
    it('returns comma-separated RGB string', () => {
      const color = new ChartColor(100, 150, 200)
      expect(color.rgb()).toBe('100,150,200')
    })

    it('handles single-digit values', () => {
      const color = new ChartColor(1, 2, 3)
      expect(color.rgb()).toBe('1,2,3')
    })

    it('handles zero values', () => {
      const color = new ChartColor(0, 0, 0)
      expect(color.rgb()).toBe('0,0,0')
    })
  })

  describe('rgbString()', () => {
    it('returns rgba string with full opacity', () => {
      const color = new ChartColor(100, 150, 200)
      expect(color.rgbString()).toBe('rgba(100,150,200,1)')
    })

    it('formats red color correctly', () => {
      const color = ChartColor.red()
      expect(color.rgbString()).toBe('rgba(220,38,38,1)')
    })

    it('formats white color correctly', () => {
      const color = ChartColor.white()
      expect(color.rgbString()).toBe('rgba(255,255,255,1)')
    })

    it('formats black color correctly', () => {
      const color = new ChartColor(0, 0, 0)
      expect(color.rgbString()).toBe('rgba(0,0,0,1)')
    })
  })
})
