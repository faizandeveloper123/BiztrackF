import type { AxiosInstance } from "axios";
import { offlineGetCacheKey, offlineRequestPathname } from "./offlineCacheKey";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeTauri<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args as never);
}

async function putHttpCache(
  tenantId: string,
  configUrl: string,
  params: Record<string, unknown> | null | undefined,
  data: unknown,
) {
  const key = offlineGetCacheKey(tenantId, configUrl, params ?? {});
  const value = typeof data === "string" ? data : JSON.stringify(data);
  await invokeTauri("offline_cache_put", { key, value });
}

async function putAggregate(
  tenantId: string,
  routeKey: string,
  payload: unknown,
) {
  await invokeTauri("offline_aggregate_put", {
    tenant_id: tenantId,
    route_key: routeKey,
    payload: JSON.stringify(payload),
  });
}

async function clearTenantCaches(tenantId: string) {
  await invokeTauri("offline_cache_clear_tenant_prefix", {
    prefix: `${tenantId}|GET|`,
  });
  await invokeTauri("offline_aggregate_clear_tenant", { tenant_id: tenantId });
}

async function safe(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch {
    void name;
  }
}

async function syncSimple(
  client: AxiosInstance,
  tenantId: string,
  url: string,
  params?: Record<string, unknown>,
) {
  const res = await client.get(url, params ? { params } : undefined);
  const cfgUrl = String(res.config.url || url);
  const p = (res.config.params as Record<string, unknown>) || params || {};
  await putHttpCache(tenantId, cfgUrl, p, res.data);
}

async function syncSalesPaged(
  client: AxiosInstance,
  tenantId: string,
  path: string,
  listKey: string,
  mergedWrapper: (items: unknown[]) => Record<string, unknown>,
) {
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await client.get(path, { params: { page, limit } });
    const body = res.data as Record<string, unknown>;
    const chunk = (body[listKey] as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    const p = (res.config.params as Record<string, unknown>) || { page, limit };
    await putHttpCache(tenantId, cfgUrl, p, res.data);
    const pages = (body.pagination as Record<string, number>)?.pages ?? 1;
    if (page >= pages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, path, mergedWrapper(all));
}

async function syncCrmQueryPaged(
  client: AxiosInstance,
  tenantId: string,
  basePath: string,
  listKey: string,
  mergedWrapper: (items: unknown[]) => Record<string, unknown>,
) {
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    const url = `${basePath}?${q.toString()}`;
    const res = await client.get(url);
    const body = res.data as Record<string, unknown>;
    const chunk = (body[listKey] as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || url);
    await putHttpCache(tenantId, cfgUrl, res.config.params || {}, res.data);
    const pages = (body.pagination as Record<string, number>)?.pages ?? 1;
    if (page >= pages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(
    tenantId,
    offlineRequestPathname(basePath),
    mergedWrapper(all),
  );
}

async function syncTasksUnfiltered(client: AxiosInstance, tenantId: string) {
  const path = "/tasks";
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await client.get(path, {
      params: {
        page,
        limit,
        include_subtasks: true,
        main_tasks_only: false,
      },
    });
    const body = res.data as Record<string, unknown>;
    const chunk = (body.tasks as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(
      tenantId,
      cfgUrl,
      res.config.params as Record<string, unknown>,
      res.data,
    );
    if (chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, path, {
    tasks: all,
    pagination: {
      page: 1,
      limit: all.length || 100,
      total: all.length,
      pages: 1,
    },
  });
}

async function syncEventsSkip(client: AxiosInstance, tenantId: string) {
  const path = "/events";
  const all: unknown[] = [];
  let skip = 0;
  const limit = 200;
  for (;;) {
    const res = await client.get(path, { params: { skip, limit } });
    const body = res.data as Record<string, unknown>;
    const chunk = (body.events as unknown[]) || (body.data as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(tenantId, cfgUrl, { skip, limit }, res.data);
    const pag = body.pagination as
      | { pages?: number; page?: number }
      | undefined;
    const pages = pag?.pages ?? 1;
    const page = pag?.page ?? skip / limit + 1;
    if (!Array.isArray(chunk) || chunk.length < limit || page >= pages) break;
    skip += limit;
  }
  await putAggregate(tenantId, path, { events: all });
}

async function syncHealthcarePagedPath(
  client: AxiosInstance,
  tenantId: string,
  pathname: string,
  listKey: string,
  defaultLimit: number,
  mergedWrapper: (items: unknown[]) => Record<string, unknown>,
) {
  const all: unknown[] = [];
  let page = 1;
  const limit = defaultLimit;
  for (;;) {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    const url = `${pathname}?${q.toString()}`;
    const res = await client.get(url);
    const body = res.data as Record<string, unknown>;
    const chunk = (body[listKey] as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || url);
    await putHttpCache(tenantId, cfgUrl, {}, res.data);
    const total = typeof body.total === "number" ? body.total : undefined;
    const pages = (body.pagination as Record<string, number>)?.pages;
    if (chunk.length < limit) break;
    if (total != null && all.length >= total) break;
    if (pages != null && page >= pages) break;
    page += 1;
  }
  await putAggregate(tenantId, pathname, mergedWrapper(all));
}

async function syncHrmPaged(
  client: AxiosInstance,
  tenantId: string,
  pathname: string,
  listKey: string,
  mergedWrapper: (items: unknown[]) => Record<string, unknown>,
) {
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    const url = `${pathname}?${q.toString()}`;
    const res = await client.get(url);
    const body = res.data as Record<string, unknown>;
    const chunk = (body[listKey] as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || url);
    await putHttpCache(tenantId, cfgUrl, {}, res.data);
    const pages = (body.pagination as Record<string, number>)?.pages ?? 1;
    if (page >= pages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, pathname, mergedWrapper(all));
}

async function syncLedgerList(
  client: AxiosInstance,
  tenantId: string,
  path: string,
  aggregateLabel: string,
) {
  const limits = [2000, 5000];
  for (const limit of limits) {
    try {
      const res = await client.get(`${path}?skip=0&limit=${limit}`);
      const cfgUrl = String(res.config.url || `${path}?skip=0&limit=${limit}`);
      await putHttpCache(tenantId, cfgUrl, { skip: 0, limit }, res.data);
      await putAggregate(tenantId, offlineRequestPathname(path), res.data);
      return;
    } catch {
      continue;
    }
  }
  void aggregateLabel;
}

async function syncInventoryPaged(
  client: AxiosInstance,
  tenantId: string,
  path: string,
  listKey: string,
  aggregate: (items: unknown[]) => Record<string, unknown>,
) {
  const all: unknown[] = [];
  let skip = 0;
  const limit = 200;
  for (;;) {
    const sep = path.includes("?") ? "&" : "?";
    const url =
      skip === 0 && !path.includes("?")
        ? `${path}?skip=0&limit=${limit}`
        : `${path}${sep}skip=${skip}&limit=${limit}`;
    const res = await client.get(url);
    const body = res.data;
    let chunk: unknown[] = [];
    if (Array.isArray(body)) {
      chunk = body;
    } else if (body && typeof body === "object") {
      const o = body as Record<string, unknown>;
      if (Array.isArray(o[listKey])) chunk = o[listKey] as unknown[];
    }
    all.push(...chunk);
    const cfgUrl = String(res.config.url || url);
    await putHttpCache(tenantId, cfgUrl, { skip, limit }, res.data);
    if (chunk.length < limit) break;
    skip += limit;
  }
  await putAggregate(
    tenantId,
    offlineRequestPathname(path.split("?")[0]),
    aggregate(all),
  );
}

async function syncInvoicesPaged(client: AxiosInstance, tenantId: string) {
  const path = "/invoices";
  const all: unknown[] = [];
  let page = 1;
  const limit = 50;
  for (;;) {
    const res = await client.get(path, { params: { page, limit } });
    const body = res.data as Record<string, unknown>;
    const inv = body.invoices as unknown[];
    const chunk = Array.isArray(inv) ? inv : [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(tenantId, cfgUrl, { page, limit }, res.data);
    const pag = body.pagination as Record<string, number> | undefined;
    const totalPages = pag?.totalPages ?? pag?.pages ?? 1;
    if (page >= totalPages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, path, {
    invoices: all,
    pagination: {
      page: 1,
      limit: all.length,
      total: all.length,
      totalPages: 1,
    },
  });
}

async function syncInstallmentPlans(client: AxiosInstance, tenantId: string) {
  const path = "/installments/installment-plans";
  const all: unknown[] = [];
  let skip = 0;
  const limit = 200;
  for (;;) {
    const res = await client.get(path, { params: { skip, limit } });
    const body = res.data;
    let chunk: unknown[] = [];
    if (Array.isArray(body)) chunk = body;
    else if (body && typeof body === "object") {
      const o = body as Record<string, unknown>;
      if (Array.isArray(o.items)) chunk = o.items as unknown[];
      else if (Array.isArray(o.plans)) chunk = o.plans as unknown[];
    }
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(tenantId, cfgUrl, { skip, limit }, res.data);
    if (chunk.length < limit) break;
    skip += limit;
  }
  await putAggregate(tenantId, path, all);
}

async function syncDeliveryNotes(client: AxiosInstance, tenantId: string) {
  const path = "/delivery-notes";
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await client.get(path, { params: { page, limit } });
    const body = res.data as Record<string, unknown>;
    const chunk =
      (body.delivery_notes as unknown[]) ||
      (body.deliveryNotes as unknown[]) ||
      (body.items as unknown[]) ||
      [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(tenantId, cfgUrl, { page, limit }, res.data);
    const pages = (body.pagination as Record<string, number>)?.pages ?? 1;
    if (page >= pages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, path, { items: all, delivery_notes: all });
}

async function syncInvestments(client: AxiosInstance, tenantId: string) {
  const path = "/investments";
  const all: unknown[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await client.get(path, { params: { page, limit } });
    const body = res.data as Record<string, unknown>;
    const chunk =
      (body.investments as unknown[]) || (body.data as unknown[]) || [];
    all.push(...chunk);
    const cfgUrl = String(res.config.url || path);
    await putHttpCache(tenantId, cfgUrl, { page, limit }, res.data);
    const pages = (body.pagination as Record<string, number>)?.pages ?? 1;
    if (page >= pages || chunk.length < limit) break;
    page += 1;
  }
  await putAggregate(tenantId, path, { investments: all });
}

async function syncProjectsDetail(
  client: AxiosInstance,
  tenantId: string,
  onDetail?: (label: string) => void,
) {
  const res = await client.get("/projects");
  await putHttpCache(
    tenantId,
    String(res.config.url || "/projects"),
    res.config.params as Record<string, unknown>,
    res.data,
  );
  const body = res.data as Record<string, unknown>;
  const projects = (body.projects as Array<{ id: string }>) || [];
  const list = projects.slice(0, 500);
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    onDetail?.(`${i + 1} / ${list.length}`);
    await safe(`project:${p.id}`, async () => {
      const r = await client.get(`/projects/${p.id}`);
      await putHttpCache(
        tenantId,
        String(r.config.url || `/projects/${p.id}`),
        r.config.params as Record<string, unknown>,
        r.data,
      );
    });
  }
}

export const TENANT_FULL_SYNC_TOTAL_STEPS = 74;

export type TenantSyncProgressPayload = {
  step: number;
  total: number;
  label: string;
};

export async function runTenantFullSync(
  client: AxiosInstance,
  tenantId: string,
  onProgress?: (p: TenantSyncProgressPayload) => void,
): Promise<void> {
  if (!isTauri() || !tenantId || !navigator.onLine) return;
  await clearTenantCaches(tenantId);
  let phase = 0;
  const total = TENANT_FULL_SYNC_TOTAL_STEPS;
  const emit = (label: string) => {
    phase += 1;
    onProgress?.({ step: Math.min(phase, total), total, label });
  };
  const rSafe = async (name: string, fn: () => Promise<void>) => {
    emit(name);
    await safe(name, fn);
  };

  await rSafe("auth_me", () => syncSimple(client, tenantId, "/auth/me"));
  await rSafe("profile_me", () => syncSimple(client, tenantId, "/profile/me"));
  await rSafe("tenant", () =>
    syncSimple(client, tenantId, `/tenants/${tenantId}`),
  );
  await rSafe("tenant_users", () =>
    syncSimple(client, tenantId, `/tenants/${tenantId}/users`),
  );
  await rSafe("permissions", () =>
    syncSimple(client, tenantId, "/tenants/permissions"),
  );
  await rSafe("custom_roles", () =>
    syncSimple(client, tenantId, `/tenants/${tenantId}/custom-roles`),
  );
  await rSafe("plans", () => syncSimple(client, tenantId, "/plans"));

  await rSafe("projects", () =>
    syncProjectsDetail(client, tenantId, (sub) =>
      onProgress?.({
        step: Math.min(phase, total),
        total,
        label: `projects ${sub}`,
      }),
    ),
  );
  await rSafe("team_members", () =>
    syncSimple(client, tenantId, "/projects/team-members"),
  );
  await rSafe("tasks", () => syncTasksUnfiltered(client, tenantId));

  await rSafe("events", () => syncEventsSkip(client, tenantId));
  await rSafe("events_upcoming", () =>
    syncSimple(client, tenantId, "/events/upcoming?days=30"),
  );

  await rSafe("sales_dash", () =>
    syncSimple(client, tenantId, "/sales/dashboard"),
  );
  await rSafe("sales_leads", () =>
    syncSalesPaged(client, tenantId, "/sales/leads", "leads", (leads) => ({
      leads,
      pagination: {
        page: 1,
        limit: leads.length,
        total: leads.length,
        pages: 1,
      },
    })),
  );
  await rSafe("sales_contacts", () =>
    syncSalesPaged(
      client,
      tenantId,
      "/sales/contacts",
      "contacts",
      (contacts) => ({
        contacts,
        pagination: {
          page: 1,
          limit: contacts.length,
          total: contacts.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("sales_companies", () =>
    syncSalesPaged(
      client,
      tenantId,
      "/sales/companies",
      "companies",
      (companies) => ({
        companies,
        pagination: {
          page: 1,
          limit: companies.length,
          total: companies.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("sales_opps", () =>
    syncSalesPaged(
      client,
      tenantId,
      "/sales/opportunities",
      "opportunities",
      (opportunities) => ({
        opportunities,
        pagination: {
          page: 1,
          limit: opportunities.length,
          total: opportunities.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("sales_quotes", () =>
    syncSalesPaged(client, tenantId, "/sales/quotes", "quotes", (quotes) => ({
      quotes,
      pagination: {
        page: 1,
        limit: quotes.length,
        total: quotes.length,
        pages: 1,
      },
    })),
  );
  await rSafe("sales_contracts", () =>
    syncSalesPaged(
      client,
      tenantId,
      "/sales/contracts",
      "contracts",
      (contracts) => ({
        contracts,
        pagination: {
          page: 1,
          limit: contracts.length,
          total: contracts.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("sales_activities", () =>
    syncSalesPaged(
      client,
      tenantId,
      "/sales/activities",
      "activities",
      (activities) => ({
        activities,
        pagination: {
          page: 1,
          limit: activities.length,
          total: activities.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("sales_rev", () =>
    syncSimple(client, tenantId, "/sales/analytics/revenue?period=monthly"),
  );
  await rSafe("sales_conv", () =>
    syncSimple(client, tenantId, "/sales/analytics/conversion"),
  );

  await rSafe("crm_leads", () =>
    syncCrmQueryPaged(client, tenantId, "/crm/leads", "leads", (leads) => ({
      leads,
      pagination: {
        page: 1,
        limit: leads.length,
        total: leads.length,
        pages: 1,
      },
    })),
  );
  await rSafe("crm_contacts", () =>
    syncCrmQueryPaged(
      client,
      tenantId,
      "/crm/contacts",
      "contacts",
      (contacts) => ({
        contacts,
        pagination: {
          page: 1,
          limit: contacts.length,
          total: contacts.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("crm_companies", () =>
    syncCrmQueryPaged(
      client,
      tenantId,
      "/crm/companies",
      "companies",
      (companies) => ({
        companies,
        pagination: {
          page: 1,
          limit: companies.length,
          total: companies.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("crm_opps", () =>
    syncCrmQueryPaged(
      client,
      tenantId,
      "/crm/opportunities",
      "opportunities",
      (opportunities) => ({
        opportunities,
        pagination: {
          page: 1,
          limit: opportunities.length,
          total: opportunities.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("crm_activities", () =>
    syncCrmQueryPaged(
      client,
      tenantId,
      "/crm/activities",
      "activities",
      (activities) => ({
        activities,
        pagination: {
          page: 1,
          limit: activities.length,
          total: activities.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("crm_dash", () => syncSimple(client, tenantId, "/crm/dashboard"));

  await rSafe("hc_doctors", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/doctors",
      "doctors",
      100,
      (doctors) => ({
        doctors,
        pagination: {
          page: 1,
          limit: doctors.length,
          total: doctors.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_patients", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/patients",
      "patients",
      500,
      (patients) => ({
        patients,
        pagination: {
          page: 1,
          limit: patients.length,
          total: patients.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_staff", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/staff",
      "staff",
      100,
      (staff) => ({
        staff,
        pagination: {
          page: 1,
          limit: staff.length,
          total: staff.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_appts", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/appointments",
      "appointments",
      100,
      (appointments) => ({
        appointments,
        pagination: {
          page: 1,
          limit: appointments.length,
          total: appointments.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_rx", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/prescriptions",
      "prescriptions",
      100,
      (prescriptions) => ({
        prescriptions,
        pagination: {
          page: 1,
          limit: prescriptions.length,
          total: prescriptions.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_exp_cat", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/expense-categories",
      "categories",
      500,
      (categories) => ({
        categories,
        pagination: {
          page: 1,
          limit: categories.length,
          total: categories.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_daily_exp", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/daily-expenses",
      "expenses",
      500,
      (expenses) => ({
        expenses,
        pagination: {
          page: 1,
          limit: expenses.length,
          total: expenses.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_admissions", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/admissions",
      "admissions",
      100,
      (admissions) => ({
        admissions,
        pagination: {
          page: 1,
          limit: admissions.length,
          total: admissions.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hc_adm_inv", () =>
    syncHealthcarePagedPath(
      client,
      tenantId,
      "/healthcare/admission-invoices",
      "invoices",
      50,
      (invoices) => ({
        invoices,
        pagination: {
          page: 1,
          limit: invoices.length,
          total: invoices.length,
          pages: 1,
        },
      }),
    ),
  );

  await rSafe("hrm_emp", () =>
    syncHrmPaged(
      client,
      tenantId,
      "/hrm/employees",
      "employees",
      (employees) => ({
        employees,
        pagination: {
          page: 1,
          limit: employees.length,
          total: employees.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hrm_jobs", () =>
    syncHrmPaged(
      client,
      tenantId,
      "/hrm/jobs",
      "jobPostings",
      (jobPostings) => ({
        jobPostings,
        pagination: {
          page: 1,
          limit: jobPostings.length,
          total: jobPostings.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hrm_apps", () =>
    syncHrmPaged(
      client,
      tenantId,
      "/hrm/applications",
      "applications",
      (applications) => ({
        applications,
        pagination: {
          page: 1,
          limit: applications.length,
          total: applications.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hrm_rev", () =>
    syncHrmPaged(client, tenantId, "/hrm/reviews", "reviews", (reviews) => ({
      reviews,
      pagination: {
        page: 1,
        limit: reviews.length,
        total: reviews.length,
        pages: 1,
      },
    })),
  );
  await rSafe("hrm_te", () =>
    syncHrmPaged(
      client,
      tenantId,
      "/hrm/time-entries",
      "timeEntries",
      (timeEntries) => ({
        timeEntries,
        pagination: {
          page: 1,
          limit: timeEntries.length,
          total: timeEntries.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hrm_lr", () =>
    syncHrmPaged(
      client,
      tenantId,
      "/hrm/leave-requests",
      "leaveRequests",
      (leaveRequests) => ({
        leaveRequests,
        pagination: {
          page: 1,
          limit: leaveRequests.length,
          total: leaveRequests.length,
          pages: 1,
        },
      }),
    ),
  );
  await rSafe("hrm_pay", () =>
    syncHrmPaged(client, tenantId, "/hrm/payroll", "payroll", (payroll) => ({
      payroll,
      pagination: {
        page: 1,
        limit: payroll.length,
        total: payroll.length,
        pages: 1,
      },
    })),
  );
  await rSafe("hrm_ben", () =>
    syncHrmPaged(client, tenantId, "/hrm/benefits", "benefits", (benefits) => ({
      benefits,
      pagination: {
        page: 1,
        limit: benefits.length,
        total: benefits.length,
        pages: 1,
      },
    })),
  );
  await rSafe("hrm_train", () =>
    syncHrmPaged(client, tenantId, "/hrm/training", "training", (training) => ({
      training,
      pagination: {
        page: 1,
        limit: training.length,
        total: training.length,
        pages: 1,
      },
    })),
  );
  await rSafe("hrm_dash", () => syncSimple(client, tenantId, "/hrm/dashboard"));

  await rSafe("inv_wh", () =>
    syncInventoryPaged(
      client,
      tenantId,
      "/inventory/warehouses",
      "warehouses",
      (items) => ({
        warehouses: items,
        total: items.length,
      }),
    ),
  );
  await rSafe("inv_sl", () =>
    syncInventoryPaged(
      client,
      tenantId,
      "/inventory/storage-locations",
      "storageLocations",
      (items) => ({
        storageLocations: items,
        total: items.length,
      }),
    ),
  );
  await rSafe("inv_sm", () =>
    syncInventoryPaged(
      client,
      tenantId,
      "/inventory/stock-movements",
      "stockMovements",
      (items) => ({
        stockMovements: items,
        total: items.length,
      }),
    ),
  );
  await rSafe("inv_po", () =>
    syncInventoryPaged(
      client,
      tenantId,
      "/inventory/purchase-orders",
      "purchaseOrders",
      (items) => ({
        purchaseOrders: items,
        total: items.length,
      }),
    ),
  );
  await rSafe("inv_rec", () =>
    syncInventoryPaged(
      client,
      tenantId,
      "/inventory/receivings",
      "receivings",
      (items) => ({
        receivings: items,
        total: items.length,
      }),
    ),
  );
  await rSafe("inv_dash", () =>
    syncSimple(client, tenantId, "/inventory/dashboard"),
  );

  await rSafe("inv_list", () => syncInvoicesPaged(client, tenantId));
  await rSafe("inv_dash_overview", () =>
    syncSimple(client, tenantId, "/invoices/dashboard/overview"),
  );

  await rSafe("inst_plans", () => syncInstallmentPlans(client, tenantId));
  await rSafe("del_notes", () => syncDeliveryNotes(client, tenantId));
  await rSafe("investments", () => syncInvestments(client, tenantId));
  await rSafe("inv_eq_dash", () =>
    syncSimple(client, tenantId, "/investments/dashboard/stats"),
  );

  await rSafe("ledger_coa", () =>
    syncLedgerList(client, tenantId, "/ledger/chart-of-accounts", "coa"),
  );
  await rSafe("ledger_tx", () =>
    syncLedgerList(client, tenantId, "/ledger/transactions", "tx"),
  );
  await rSafe("ledger_je", () =>
    syncLedgerList(client, tenantId, "/ledger/journal-entries", "je"),
  );
  await rSafe("ledger_fp", () =>
    syncLedgerList(client, tenantId, "/ledger/financial-periods", "fp"),
  );
  await rSafe("ledger_bd", () =>
    syncLedgerList(client, tenantId, "/ledger/budgets", "bd"),
  );

  await rSafe("custom_ev", () =>
    syncSimple(client, tenantId, "/custom-options/event-types"),
  );
  await rSafe("custom_dep", () =>
    syncSimple(client, tenantId, "/custom-options/departments"),
  );
  await rSafe("custom_lt", () =>
    syncSimple(client, tenantId, "/custom-options/leave-types"),
  );
  await rSafe("custom_ls", () =>
    syncSimple(client, tenantId, "/custom-options/lead-sources"),
  );
  await rSafe("custom_ct", () =>
    syncSimple(client, tenantId, "/custom-options/contact-types"),
  );
  await rSafe("custom_ind", () =>
    syncSimple(client, tenantId, "/custom-options/industries"),
  );

  await rSafe("sub_bill", () =>
    syncSimple(
      client,
      tenantId,
      `/subscriptions/billing?tenant_id=${tenantId}`,
    ),
  );
  await rSafe("sub_use", () =>
    syncSimple(client, tenantId, `/subscriptions/usage?tenant_id=${tenantId}`),
  );
}

export async function scheduleTenantFullSync(
  client: AxiosInstance,
  tenantId: string | null,
  onProgress?: (p: TenantSyncProgressPayload) => void,
) {
  if (!tenantId || !isTauri() || !navigator.onLine) return;
  void runTenantFullSync(client, tenantId, onProgress);
}
