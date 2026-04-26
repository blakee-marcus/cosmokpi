import type { EmployeeKpiRow } from './types';

function normalizeComparisonValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getEmployeeComparisonKey(employee: Pick<EmployeeKpiRow, 'name' | 'storeName'>) {
  return `${normalizeComparisonValue(String(employee.name))}:${normalizeComparisonValue(
    String(employee.storeName),
  )}`;
}

export function getStoreComparisonKey(storeName: string) {
  return normalizeComparisonValue(storeName);
}
