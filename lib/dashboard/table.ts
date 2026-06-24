import { isManagementRole } from './roles';
import { MINIMUM_GAMES_FOR_RANKING } from './constants';
import { normalizePercent } from './formatters';
import type { EmployeeKpiRow, SortKey } from './types';

export const DEFAULT_SORT_KEY: SortKey = 'replaysSoldPercent';

function compareEmployeeIdentity(a: EmployeeKpiRow, b: EmployeeKpiRow) {
  const nameComparison = String(a.name).localeCompare(String(b.name));
  if (nameComparison !== 0) return nameComparison;

  const storeComparison = String(a.storeName).localeCompare(String(b.storeName));
  if (storeComparison !== 0) return storeComparison;

  return String(a.role).localeCompare(String(b.role));
}

export function getSortValue(employee: EmployeeKpiRow, sortKey: SortKey) {
  const value = Number(employee[sortKey]);

  return sortKey.endsWith('Percent') ? normalizePercent(value) : value;
}

export function rankEmployees(employees: EmployeeKpiRow[], sortKey: SortKey) {
  return [...employees]
    .filter(
      (employee) =>
        Number(employee.totalGames) >= MINIMUM_GAMES_FOR_RANKING &&
        !isManagementRole(employee.role),
    )
    .sort((a, b) => {
      if (sortKey === 'name') {
        return compareEmployeeIdentity(a, b);
      }

      const valueComparison = getSortValue(b, sortKey) - getSortValue(a, sortKey);
      if (valueComparison !== 0) return valueComparison;

      const gamesComparison = Number(b.totalGames) - Number(a.totalGames);
      if (gamesComparison !== 0) return gamesComparison;

      return compareEmployeeIdentity(a, b);
    });
}

export function filterEmployees(employees: EmployeeKpiRow[], searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return employees;
  }

  return employees.filter((employee) =>
    [employee.name, employee.role, employee.storeName]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );
}
