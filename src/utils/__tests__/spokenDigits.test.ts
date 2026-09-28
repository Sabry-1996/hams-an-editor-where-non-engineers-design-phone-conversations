import { describe, expect, it } from 'vitest';
import { digitsOf } from '../spokenDigits';

describe('digitsOf', () => {
  it('keeps written digits, including Arabic-Indic', () => {
    expect(digitsOf('٤٤٧١٠٢٨')).toBe('4471028');
    expect(digitsOf('البطاقة 4471028')).toBe('4471028');
  });

  it('reads English digit words', () => {
    expect(digitsOf('one two three four')).toBe('1234');
  });

  it('reads Arabic digit words', () => {
    expect(digitsOf('اتنين ثلاثة أربعة')).toBe('234');
    expect(digitsOf('أربعة أربعة سبعة واحد صفر اثنين ثمانية')).toBe('4471028');
  });

  it('reads a mix of words and numerals', () => {
    expect(digitsOf('four four 7 واحد')).toBe('4471');
  });

  it('returns nothing when no number was said', () => {
    expect(digitsOf('أشعة رنين')).toBe('');
  });
});
