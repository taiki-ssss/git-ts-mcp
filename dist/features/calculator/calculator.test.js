import { test, expect } from 'vitest';
import { add, sub } from './calculator.js';
test('1+2=3', () => {
    expect(add(1, 2)).toBe(3);
});
test('2-1=1', () => {
    expect(sub(2, 1)).toBe(1);
});
