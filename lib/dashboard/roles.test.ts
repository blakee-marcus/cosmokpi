import { describe, expect, it } from 'vitest';

import { isManagementRole } from './roles';

describe('isManagementRole', () => {
  it('identifies common management role strings', () => {
    expect(isManagementRole('Management')).toBe(true);
    expect(isManagementRole('management')).toBe(true);
    expect(isManagementRole('Manager')).toBe(true);
    expect(isManagementRole('General Manager')).toBe(true);
    expect(isManagementRole('Assistant Manager')).toBe(true);
    expect(isManagementRole('GM')).toBe(true);
    expect(isManagementRole('GMIT')).toBe(true);
    expect(isManagementRole('AM')).toBe(true);
    expect(isManagementRole('AMIT')).toBe(true);
  });

  it('excludes frontline roles', () => {
    expect(isManagementRole('GG')).toBe(false);
    expect(isManagementRole('Game Guide')).toBe(false);
    expect(isManagementRole('Team Leader')).toBe(false);
    expect(isManagementRole('TL')).toBe(false);
  });

  it('handles undefined and empty role gracefully', () => {
    expect(isManagementRole(undefined)).toBe(false);
    expect(isManagementRole('')).toBe(false);
  });

  it('handles case-insensitively and normalizes whitespace', () => {
    expect(isManagementRole('MANAGEMENT')).toBe(true);
    expect(isManagementRole('  management  ')).toBe(true);
    expect(isManagementRole('general   manager')).toBe(true);
  });
});