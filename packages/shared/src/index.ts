/**
 * Converts Arabic-Indic numerals (٠-٩) to Latin numerals (0-9)
 */
export function convertArabicNumerals(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d).toString());
}

/**
 * Normalizes an automotive spare part number:
 * 1. Converts Arabic-Indic numerals to Latin
 * 2. Converts to uppercase
 * 3. Strips whitespace, hyphens, dots, slashes and underscores
 *
 * Examples:
 *   "04465-33471"    -> "0446533471"
 *   "oem 12345/A"    -> "OEM12345A"
 *   "oem-١٢٣٤٥"       -> "OEM12345"
 *   " 21410.1EA0A_ " -> "214101EA0A"
 */
export function normalizePartNumber(input: string | null | undefined): string {
  if (!input) return '';
  const converted = convertArabicNumerals(input.trim());
  return converted.toUpperCase().replace(/[\s\-\.\/\\_]/g, '');
}

/**
 * Money calculations in strict integer Halalas (1 SAR = 100 Halalas)
 */
export function sarToHalalas(sar: number): number {
  return Math.round(sar * 100);
}

export function halalasToSar(halalas: number): number {
  return halalas / 100;
}

export function calculateVat(subtotalHalalas: number, vatPercent: number = 15): number {
  return Math.round((subtotalHalalas * vatPercent) / 100);
}

/**
 * Saudi mobile phone number validation (+9665XXXXXXXX)
 */
export function validateSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^(\+9665\d{8}|05\d{8})$/.test(cleaned);
}
