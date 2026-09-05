import type { User } from "@/src/models";

export function getTenantIdFromStorage(): string | null {
  const selectedTenant = localStorage.getItem("selectedTenant");
  if (selectedTenant) {
    try {
      const parsed = JSON.parse(selectedTenant);
      return parsed.id || parsed.tenantId || null;
    } catch {
      return null;
    }
  }
  return localStorage.getItem("currentTenantId");
}

export function dedupeTenantUsers(users: User[]): User[] {
  return users.reduce<User[]>((acc, user) => {
    const existing = acc.find(
      (u) => u.userId === user.userId || u.id === user.userId,
    );
    if (!existing) {
      acc.push(user);
    }
    return acc;
  }, []);
}
