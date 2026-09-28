import { describe, expect, it } from 'vitest';
import { DEFAULT_FLOW } from '../../data/defaultFlow';
import { askChoiceButtons, equalsRule, matchesAskChoice } from '../ruleValue';

describe('eq choices', () => {
  it('matches either language', () => {
    const value = { ar: 'نعم', en: 'yes' };
    expect(equalsRule('نعم', value)).toBe(true);
    expect(equalsRule('YES', value)).toBe(true);
    expect(equalsRule('لا', value)).toBe(false);
  });

  it('shows the booking answers in the call language', () => {
    expect(askChoiceButtons(DEFAULT_FLOW, 'ask_book', 'ar').map(choice => choice.label)).toEqual(['نعم', 'لا']);
    expect(askChoiceButtons(DEFAULT_FLOW, 'ask_book', 'en').map(choice => choice.label)).toEqual(['yes', 'no']);
    expect(askChoiceButtons(DEFAULT_FLOW, 'ask_member', 'ar')).toEqual([]);
  });

  it('accepts a button label as the answer', () => {
    expect(matchesAskChoice(DEFAULT_FLOW, 'ask_book', 'نعم')).toBe(true);
    expect(matchesAskChoice(DEFAULT_FLOW, 'ask_book', 'maybe')).toBe(false);
  });
});
