/**
 * Determine whether an employee role is a management role.
 *
 * Management employees are excluded from coaching insights,
 * ranking tables, and newsletter exports because they are
 * not measured against the same KPI targets as frontline staff.
 */
export function isManagementRole(role: string | number | undefined) {
  const normalizedRole = String(role ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const managementRoles = new Set([
    'manager',
    'management',
    'general manager',
    'assistant manager',
    'gm',
    'gmit',
    'am',
    'amit',
  ]);

  if (managementRoles.has(normalizedRole)) return true;

  return (
    normalizedRole.includes('general manager') ||
    normalizedRole.includes('assistant manager') ||
    normalizedRole.includes('manager in training') ||
    normalizedRole.includes('management')
  );
}