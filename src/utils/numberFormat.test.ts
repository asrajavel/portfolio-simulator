import { formatNumber, parseFormattedNumber, formatCurrency } from './numberFormat';

describe('numberFormat', () => {
  describe('formatNumber', () => {
    it('formats numbers with Indian locale commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(10000)).toBe('10,000');
      expect(formatNumber(100000)).toBe('1,00,000');
      expect(formatNumber(1000000)).toBe('10,00,000');
      expect(formatNumber(10000000)).toBe('1,00,00,000');
    });

    it('handles small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(50)).toBe('50');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('parseFormattedNumber', () => {
    it('parses formatted numbers correctly', () => {
      expect(parseFormattedNumber('1,000')).toBe(1000);
      expect(parseFormattedNumber('10,000')).toBe(10000);
      expect(parseFormattedNumber('1,00,000')).toBe(100000);
      expect(parseFormattedNumber('10,00,000')).toBe(1000000);
    });

    it('handles unformatted numbers', () => {
      expect(parseFormattedNumber('1000')).toBe(1000);
      expect(parseFormattedNumber('12345')).toBe(12345);
    });

    it('strips non-numeric characters', () => {
      expect(parseFormattedNumber('₹1,000')).toBe(1000);
      expect(parseFormattedNumber('$10,000')).toBe(10000);
      expect(parseFormattedNumber('abc123def')).toBe(123);
    });

    it('returns 0 for invalid input', () => {
      expect(parseFormattedNumber('')).toBe(0);
      expect(parseFormattedNumber('abc')).toBe(0);
      expect(parseFormattedNumber('---')).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats as Indian currency', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
    });

    it('handles decimal places', () => {
      expect(formatCurrency(1000.55, 2)).toBe('₹1,000.55');
      expect(formatCurrency(100000.123, 2)).toBe('₹1,00,000.12');
    });

    it('defaults to no decimals and rounds', () => {
      expect(formatCurrency(1000.99)).toBe('₹1,001');
      expect(formatCurrency(100000.50)).toBe('₹1,00,001');
      expect(formatCurrency(100000.49)).toBe('₹1,00,000');
    });
  });
});

