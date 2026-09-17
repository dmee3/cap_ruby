import { describe, it, expect } from 'vitest'
import { typeChip, isFolder } from './fileType'

describe('typeChip', () => {
  it('labels the four types the API names itself', () => {
    expect(typeChip('pdf')).toBe('PDF')
    expect(typeChip('document')).toBe('DOC')
    expect(typeChip('audio')).toBe('AUD')
    expect(typeChip('folder')).toBe('DIR')
  })

  // Everything the API doesn't map arrives as a raw MIME string, which is why
  // the chip can't just upcase what it's given.
  it('labels a spreadsheet the API passes through as raw MIME', () => {
    expect(
      typeChip('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ).toBe('XLS')
  })

  it('groups images and video by their MIME prefix', () => {
    expect(typeChip('image/png')).toBe('IMG')
    expect(typeChip('video/quicktime')).toBe('VID')
  })

  it('falls back to the extension for a type nobody has mapped', () => {
    expect(typeChip('application/x-rehearsal', 'run-through.wav')).toBe('WAV')
  })

  it('says FILE rather than guessing when there is nothing to go on', () => {
    expect(typeChip('application/x-rehearsal')).toBe('FILE')
    expect(typeChip('application/x-rehearsal', 'no-extension')).toBe('FILE')
  })
})

describe('isFolder', () => {
  it('is true only for the folder type', () => {
    expect(isFolder('folder')).toBe(true)
    expect(isFolder('pdf')).toBe(false)
  })
})
