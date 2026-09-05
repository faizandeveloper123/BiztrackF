import { INVENTORY_NATIVE_PATHS } from '../features/inventory/inventoryPaths';
import { POS_NATIVE_PATHS } from '../features/pos/posPaths';
import { HRM_NATIVE_PATHS } from '../features/hrm/hrmPaths';
import { PROJECT_NATIVE_PATHS } from '../features/projects/projectPaths';
import { BANKING_NATIVE_PATHS } from '../features/banking/bankingPaths';
import { LEDGER_NATIVE_PATHS } from '../features/ledger/ledgerPaths';
import { SETTINGS_NATIVE_PATHS } from '../features/settings/settingsPaths';
import { WORKSPACE_HUB_PATHS } from '../features/workspace/workspacePaths';
import { HEALTHCARE_NATIVE_PATHS } from '../features/healthcare/healthcarePaths';
import { WORKSHOP_NATIVE_PATHS } from '../features/workshop/workshopPaths';
import { EMPLOYEE_PORTAL_PATHS } from '../features/employee-portal/employeePortalPaths';

export const NATIVE_WORKSPACE_PATHS = [
  '/dashboard',
  ...EMPLOYEE_PORTAL_PATHS,
  ...HEALTHCARE_NATIVE_PATHS,
  ...WORKSHOP_NATIVE_PATHS,
  '/crm',
  '/crm/customers',
  '/crm/contacts',
  '/crm/companies',
  '/crm/leads',
  '/crm/opportunities',
  '/crm/agent-portal',
  '/sales/quotes',
  '/sales/contracts',
  '/sales/analytics',
  '/sales/invoices',
  '/sales/installments',
  '/sales/delivery-notes',
  ...INVENTORY_NATIVE_PATHS,
  ...POS_NATIVE_PATHS,
  ...HRM_NATIVE_PATHS,
  ...PROJECT_NATIVE_PATHS,
  ...BANKING_NATIVE_PATHS,
  ...LEDGER_NATIVE_PATHS,
  ...SETTINGS_NATIVE_PATHS,
  ...WORKSPACE_HUB_PATHS,
] as const;

export type NativeWorkspacePath = (typeof NATIVE_WORKSPACE_PATHS)[number];

export function isNativeWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (NATIVE_WORKSPACE_PATHS as readonly string[]).includes(n);
}
