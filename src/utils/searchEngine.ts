/**
 * Normalizes automotive part numbers for robust lookup.
 * Removes spaces, hyphens, periods, slashes, and turns uppercase.
 * e.g., '04465-33471' -> '0446533471'
 * e.g., 'oem 12345' -> 'OEM12345'
 */
export function normalizePartNumber(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Checks whether a given part is compatible with a selected vehicle.
 */
import { Part, Vehicle } from '../types';

export function checkFitment(part: Part, vehicle: Vehicle | null): {
  fits: boolean;
  notes?: string;
} {
  if (!vehicle || !vehicle.make || !vehicle.model || !vehicle.year) {
    return { fits: false };
  }

  const match = part.fitments.find(f => 
    f.make.toLowerCase() === vehicle.make.toLowerCase() &&
    f.model.toLowerCase() === vehicle.model.toLowerCase() &&
    f.years.includes(Number(vehicle.year))
  );

  if (match) {
    return {
      fits: true,
      notes: match.notes || 'Direct exact OEM fitment guaranteed'
    };
  }

  return { fits: false };
}
