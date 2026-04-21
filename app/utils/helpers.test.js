import { describe, test, expect } from 'vitest';
const { toCamelCase, parseMoneda } = require('./helpers');

describe('helpers', () => {
  describe('toCamelCase', () => {
    test('should convert simple snake_case keys to camelCase', () => {
      const input = { first_name: 'John', last_name: 'Doe' };
      const result = toCamelCase(input);
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    test('should handle deeply nested objects', () => {
      const input = {
        user_info: {
          home_address: {
            street_name: 'Main St'
          }
        }
      };
      const result = toCamelCase(input);
      expect(result).toEqual({
        userInfo: {
          homeAddress: {
            streetName: 'Main St'
          }
        }
      });
    });

    test('should convert arrays of objects', () => {
      const input = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ];
      const result = toCamelCase(input);
      expect(result).toEqual([
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' }
      ]);
    });

    test('should return primitive values unchanged', () => {
      expect(toCamelCase('hello')).toBe('hello');
      expect(toCamelCase(123)).toBe(123);
      expect(toCamelCase(null)).toBe(null);
      expect(toCamelCase(undefined)).toBe(undefined);
    });

    test('should return null when input is null', () => {
      expect(toCamelCase(null)).toBe(null);
    });

    test('should handle empty objects', () => {
      expect(toCamelCase({})).toEqual({});
      expect(toCamelCase([])).toEqual([]);
    });

    test('should not convert keys that are already camelCase', () => {
      const input = { firstName: 'John', lastName: 'Doe' };
      const result = toCamelCase(input);
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    test('should handle mixed case keys', () => {
      const input = { user_Name: 'John', userName: 'Jane' };
      const result = toCamelCase(input);
      expect(result).toEqual({ userName: 'John', userName: 'Jane' });
    });
  });

  describe('parseMoneda', () => {
    test('should return correct number when given a numeric input', () => {
      expect(parseMoneda(100)).toBe(100);
      expect(parseMoneda(0)).toBe(0);
      expect(parseMoneda(123.45)).toBe(123.45);
      expect(parseMoneda(-50)).toBe(-50);
    });

    test('should parse string with S/ prefix', () => {
      expect(parseMoneda('S/100')).toBe(100);
      expect(parseMoneda('S/123.45')).toBe(123.45);
    });

    test('should parse string with commas as thousands separator', () => {
      expect(parseMoneda('1,000')).toBe(1000);
      expect(parseMoneda('1,234,567')).toBe(1234567);
      expect(parseMoneda('S/1,234.56')).toBe(1234.56);
    });

    test('should handle string with spaces', () => {
      expect(parseMoneda('  100  ')).toBe(100);
      expect(parseMoneda('S/ 100 ')).toBe(100);
    });

    test('should return 0 when input is null or undefined', () => {
      expect(parseMoneda(null)).toBe(0);
      expect(parseMoneda(undefined)).toBe(0);
    });

    test('should return 0 when input is an empty string', () => {
      expect(parseMoneda('')).toBe(0);
    });

    test('should return 0 when input is not a valid number', () => {
      expect(parseMoneda('abc')).toBe(0);
      expect(parseMoneda('S/abc')).toBe(0);
    });

    test('should handle negative values', () => {
      expect(parseMoneda('-100')).toBe(-100);
      expect(parseMoneda('S/-50.25')).toBe(-50.25);
    });

    test('should handle decimal values correctly', () => {
      expect(parseMoneda('123.456')).toBe(123.456);
      expect(parseMoneda('S/0.99')).toBe(0.99);
    });
  });
});
