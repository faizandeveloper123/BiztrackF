"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import agentPortalService, {
  AgentAchievements,
  AgentEarnings,
  AgentLeadsResponse,
  AgentOverview,
  AgentPortalFilters,
  LeaderboardRow,
  PipelineStage,
  TeamMember,
} from "@/src/services/AgentPortalService";
import { AgentPortalDateFilter } from "@/src/components/crm/agent-portal/AgentPortalDateFilter";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useRBAC, type UserWithPermissions } from "@/src/contexts/RBACContext";
import {
  Target,
  TrendingUp,
  Trophy,
  Users,
  DollarSign,
  Award,
} from "lucide-react";
import { toast } from "sonner";

function stageLabel(stage: string): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isManager(
  userPermissions: ReturnType<typeof useRBAC>["userPermissions"],
) {
  if (!userPermissions) return false;
  if (userPermissions.is_owner) return true;
  const name = userPermissions.role?.name || "";
  return name === "owner" || name.endsWith("_manager");
}

export default function AgentPortalPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <AgentPortalContent />
    </ModuleGuard>
  );
}

function agentOptionId(u: UserWithPermissions): string {
  return u.id || "";
}

function agentOptionLabel(u: UserWithPermissions): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.userName || u.email;
}

function AgentPortalContent() {
  const { formatCurrency } = useCurrency();
  const { userPermissions, tenantUsers, fetchTenantUsers } = useRBAC();
  const manager = isManager(userPermissions);
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState<AgentPortalFilters>({
    quickFilter: "30d",
  });
  const [overview, setOverview] = useState<AgentOverview | null>(null);
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [achievements, setAchievements] = useState<AgentAchievements | null>(
    null,
  );
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<AgentLeadsResponse | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState<string | undefined>(
    undefined,
  );
  const [targetAmount, setTargetAmount] = useState("10000");

  const agentUsers = (tenantUsers || []).filter(
    (u) => agentOptionId(u) && u.isActive !== false,
  );

  useEffect(() => {
    if (!manager) return;
    void fetchTenantUsers();
  }, [manager]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, earn, ach, pipe, leadData, lb] = await Promise.all([
        agentPortalService.getOverview(filters),
        agentPortalService.getEarnings(filters),
        agentPortalService.getAchievements(filters),
        agentPortalService.getPipeline(filters),
        agentPortalService.getLeads(1, 50, filters),
        agentPortalService.getLeaderboard(filters),
      ]);
      setOverview(ov);
      setEarnings(earn);
      setAchievements(ach);
      setPipeline(pipe.pipeline);
      setLeads(leadData);
      setLeaderboard(lb.leaderboard);
      if (manager) {
        const t = await agentPortalService.getTeam(filters);
        setTeam(t.members);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, manager]);

  useEffect(() => {
    load();
  }, [load]);

  const level = overview?.level || achievements?.level;
  const now = new Date();

  const saveTarget = async () => {
    if (!targetUserId) {
      toast.error("Select an agent");
      return;
    }
    try {
      await agentPortalService.setTarget(
        targetUserId,
        now.getFullYear(),
        now.getMonth() + 1,
        parseFloat(targetAmount) || 0,
      );
      toast.success("Target updated");
      load();
    } catch {
      toast.error("Failed to set target");
    }
  };

  if (loading && !overview) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Agent Portal</h1>
            <p className="text-muted-foreground">
              Performance, earnings, pipeline, and achievements
            </p>
          </div>
          {level && (
            <div className="flex items-center gap-3 rounded-lg border px-4 py-2 bg-muted/30">
              <span className="text-2xl">{level.current.icon}</span>
              <div>
                <p className="font-semibold">{level.current.label}</p>
                <p className="text-xs text-muted-foreground">
                  Target {level.targetAchievementPct}% · Installments{" "}
                  {level.installmentCompletionPct ?? 0}%
                </p>
              </div>
              <Progress value={level.progressPct} className="w-24 h-2" />
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Global Date Filter</CardTitle>
            <CardDescription>
              Applies across Overview, Earnings, Pipeline, Leads, and
              Achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AgentPortalDateFilter filters={filters} onChange={setFilters} />
            {manager && (
              <Select
                value={filters.agentId || "self"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    agentId: v === "self" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="View agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">My data</SelectItem>
                  {agentUsers.map((u) => {
                    const id = agentOptionId(u);
                    return (
                      <SelectItem key={id} value={id}>
                        {agentOptionLabel(u)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="leads">My Leads</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            {manager && <TabsTrigger value="team">Team</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab
              overview={overview}
              formatCurrency={formatCurrency}
              leaderboard={leaderboard}
            />
          </TabsContent>
          <TabsContent value="earnings" className="mt-4">
            <EarningsTab earnings={earnings} formatCurrency={formatCurrency} />
          </TabsContent>
          <TabsContent value="leads" className="mt-4">
            <LeadsTab leads={leads} />
          </TabsContent>
          <TabsContent value="pipeline" className="mt-4">
            <PipelineTab pipeline={pipeline} formatCurrency={formatCurrency} />
          </TabsContent>
          <TabsContent value="achievements" className="mt-4">
            <AchievementsTab achievements={achievements} />
          </TabsContent>
          {manager && (
            <TabsContent value="team" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Set Monthly Target</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentUsers.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No agents available
                        </SelectItem>
                      ) : (
                        agentUsers.map((u) => {
                          const id = agentOptionId(u);
                          return (
                            <SelectItem key={id} value={id}>
                              {agentOptionLabel(u)}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="sm:w-40"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Target amount"
                  />
                  <Button onClick={saveTarget}>Save Target</Button>
                </CardContent>
              </Card>
              <TeamTab team={team} formatCurrency={formatCurrency} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({
  overview,
  formatCurrency,
  leaderboard,
}: {
  overview: AgentOverview | null;
  formatCurrency: (n: number) => string;
  leaderboard: LeaderboardRow[];
}) {
  if (!overview) return null;
  const kpis = [
    {
      label: "Total Earnings",
      value: formatCurrency(overview.totalEarnings),
      icon: DollarSign,
    },
    {
      label: "Deals Closed",
      value: String(overview.dealsClosed),
      icon: Target,
    },
    {
      label: "Pending Installments",
      value: formatCurrency(overview.pendingInstallments),
      icon: TrendingUp,
    },
    {
      label: "Target Achievement",
      value: `${overview.targetAchievementPct}%`,
      icon: Award,
    },
    {
      label: "Remaining Target",
      value: formatCurrency(overview.remainingTargetAmount),
      icon: Target,
    },
    { label: "Win Rate", value: `${overview.winRatePct}%`, icon: TrendingUp },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <k.icon className="w-4 h-4" />
                {k.label}
              </CardDescription>
              <CardTitle className="text-2xl">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.slice(0, 5).map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell>#{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{formatCurrency(r.totalEarnings)}</TableCell>
                    <TableCell>{r.dealsClosed}</TableCell>
                    <TableCell>
                      {r.level.current.icon} {r.level.current.label}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EarningsTab({
  earnings,
  formatCurrency,
}: {
  earnings: AgentEarnings | null;
  formatCurrency: (n: number) => string;
}) {
  if (!earnings) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle>{formatCurrency(earnings.totalEarnings)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deal Closed Value</CardDescription>
            <CardTitle>{formatCurrency(earnings.dealClosedValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Installments</CardDescription>
            <CardTitle>
              {formatCurrency(earnings.pendingInstallments)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle>{earnings.winRatePct}%</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Earnings by Client</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.clients.map((c) => (
                <TableRow key={c.contactId}>
                  <TableCell className="font-medium">{c.clientName}</TableCell>
                  <TableCell>{c.source}</TableCell>
                  <TableCell>{formatCurrency(c.dealValue)}</TableCell>
                  <TableCell>{formatCurrency(c.paidAmount)}</TableCell>
                  <TableCell>{formatCurrency(c.remainingBalance)}</TableCell>
                  <TableCell>{c.contributionPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LeadsTab({ leads }: { leads: AgentLeadsResponse | null }) {
  if (!leads) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Leads ({leads.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.leads.map((l) => (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                onClick={() => (window.location.href = `/crm/leads/${l.id}`)}
              >
                <TableCell className="font-medium">
                  {l.firstName} {l.lastName}
                </TableCell>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.company || "—"}</TableCell>
                <TableCell>{l.leadSource || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{l.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PipelineTab({
  pipeline,
  formatCurrency,
}: {
  pipeline: PipelineStage[];
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pipeline.map((s) => (
        <Card key={s.stage}>
          <CardHeader>
            <CardTitle>{stageLabel(s.stage)}</CardTitle>
            <CardDescription>{s.count} opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(s.amount)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AchievementsTab({
  achievements,
}: {
  achievements: AgentAchievements | null;
}) {
  if (!achievements) return null;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.badges.map((b) => (
            <div
              key={b.key}
              className={`rounded-lg border p-4 ${b.earned ? "bg-primary/5 border-primary/30" : "opacity-60"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{b.icon}</span>
                <span className="font-semibold">{b.label}</span>
                {b.earned && <Badge>Earned</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.milestones.map((m) => (
            <div key={m.pct} className="flex items-center gap-3">
              <span className="text-lg w-8">{m.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.label}</span>
                  <span>{m.pct}%</span>
                </div>
                <Progress
                  value={
                    m.unlocked
                      ? 100
                      : (Math.min(achievements.targetAchievementPct, m.pct) /
                          m.pct) *
                        100
                  }
                />
              </div>
              <Badge variant={m.unlocked ? "default" : "secondary"}>
                {m.unlocked ? "Unlocked" : "Locked"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamTab({
  team,
  formatCurrency,
}: {
  team: TeamMember[];
  formatCurrency: (n: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Analytics</CardTitle>
        <CardDescription>Full team performance overview</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Deals</TableHead>
              <TableHead>Target %</TableHead>
              <TableHead>Win Rate</TableHead>
              <TableHead>Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((m) => (
              <TableRow key={m.userId}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{formatCurrency(m.totalEarnings)}</TableCell>
                <TableCell>{m.dealsClosed}</TableCell>
                <TableCell>{m.targetAchievementPct}%</TableCell>
                <TableCell>{m.winRatePct}%</TableCell>
                <TableCell>
                  {m.level.current.icon} {m.level.current.label}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
