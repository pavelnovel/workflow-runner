/**
 * UNIT TESTS - Type Utilities
 *
 * Tests for helper functions in types.ts
 */

import { describe, it, expect } from 'vitest';
import { stripEmojis, getIntervalDays } from '../../types';

describe('Unit Tests - stripEmojis', () => {
  it('should remove single emoji from text', () => {
    expect(stripEmojis('Hello 👋 World')).toBe('Hello  World');
  });

  it('should remove multiple emojis from text', () => {
    expect(stripEmojis('🎉 Party 🎊 Time 🥳')).toBe('Party  Time');
  });

  it('should handle text with only emojis', () => {
    expect(stripEmojis('🔥🚀💯')).toBe('');
  });

  it('should return original text when no emojis', () => {
    expect(stripEmojis('Hello World')).toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(stripEmojis('')).toBe('');
  });

  it('should remove emoji from step titles', () => {
    expect(stripEmojis('📹 Download Zoom Replay')).toBe('Download Zoom Replay');
  });

  it('should handle complex unicode emojis', () => {
    expect(stripEmojis('Task ✅ Done')).toBe('Task  Done');
  });
});

describe('Unit Tests - getIntervalDays', () => {
  it('should return 1 for daily interval', () => {
    expect(getIntervalDays('daily')).toBe(1);
  });

  it('should return 7 for weekly interval', () => {
    expect(getIntervalDays('weekly')).toBe(7);
  });

  it('should return 14 for biweekly interval', () => {
    expect(getIntervalDays('biweekly')).toBe(14);
  });

  it('should return 30 for monthly interval', () => {
    expect(getIntervalDays('monthly')).toBe(30);
  });

  it('should return 90 for quarterly interval', () => {
    expect(getIntervalDays('quarterly')).toBe(90);
  });

  it('should return 14 as default for unknown interval', () => {
    // @ts-expect-error - testing invalid input
    expect(getIntervalDays('unknown')).toBe(14);
  });
});
