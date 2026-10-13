import { describe, it, expect } from 'vitest';
import { normalizePartNumber, sarToHalalas, halalasToSar, calculateVat, validateSaudiPhone } from './index';

describe('Part Number Normalization', () => {
  it('strips dashes, spaces, dots, slashes and normalizes casing', () => {
    expect(normalizePartNumber('04465-33471')).toBe('0446533471');
    expect(normalizePartNumber('oem 12345/A')).toBe('OEM12345A');
    expect(normalizePartNumber(' 21410.1EA0A_ ')).toBe('214101EA0A');
    expect(normalizePartNumber('OEM-12345')).toBe('OEM12345');
    expect(normalizePartNumber('oem 12345')).toBe('OEM12345');
    expect(normalizePartNumber('OEM12345')).toBe('OEM12345');
  });

  it('converts Arabic-Indic numerals to Latin numerals', () => {
    expect(normalizePartNumber('oem-١٢٣٤٥')).toBe('OEM12345');
    expect(normalizePartNumber('٠٤٤٦٥-٣٣٤٧١')).toBe('0446533471');
  });

  it('handles empty and null values gracefully', () => {
    expect(normalizePartNumber('')).toBe('');
    expect(normalizePartNumber(null)).toBe('');
    expect(normalizePartNumber(undefined)).toBe('');
  });
});

describe('Money & VAT Calculations (Halalas)', () => {
  it('converts SAR to integer halalas and back accurately', () => {
    expect(sarToHalalas(285.50)).toBe(28550);
    expect(halalasToSar(28550)).toBe(285.50);
  });

  it('calculates 15% ZATCA VAT in halalas without floating point drift', () => {
    const subtotal = sarToHalalas(100.00); // 10,000 Halalas
    const vat = calculateVat(subtotal, 15); // 1,500 Halalas = 15.00 SAR
    expect(vat).toBe(1500);
    expect(subtotal + vat).toBe(11500);
  });
});

describe('Saudi Mobile Phone Validation', () => {
  it('validates +9665 and 05 prefixes correctly', () => {
    expect(validateSaudiPhone('+966501234567')).toBe(true);
    expect(validateSaudiPhone('0559876543')).toBe(true);
    expect(validateSaudiPhone('+966112345678')).toBe(false); // Landline not allowed
    expect(validateSaudiPhone('12345678')).toBe(false);
  });
});
