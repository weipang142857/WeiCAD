import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseStepHeader } from './stepHeader';

const SAMPLE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('FreeCAD Model'),'2;1');
FILE_NAME('/home/x/lego_brick.step',
  '2018-09-21T17:26:33',('Author'),(''),
  'Open CASCADE STEP processor 7.1','FreeCAD','Unknown');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));
ENDSEC;
DATA;`;

describe('parseStepHeader', () => {
  it('extracts preprocessor, originating system, author, and schema', () => {
    const h = parseStepHeader(SAMPLE);
    expect(h.preprocessor).toBe('Open CASCADE STEP processor 7.1');
    expect(h.originatingSystem).toBe('FreeCAD');
    expect(h.author).toBe('Author');
    expect(h.schema).toContain('AUTOMOTIVE_DESIGN');
  });

  it('parses the real fixture header', () => {
    const text = readFileSync('test/fixtures/lego_brick.step', 'latin1').slice(0, 2000);
    const h = parseStepHeader(text);
    expect(h.schema).toContain('214');
  });

  it('returns empty object on garbage', () => {
    expect(parseStepHeader('not a step file')).toEqual({});
  });
});
