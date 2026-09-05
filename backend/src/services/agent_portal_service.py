import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from ..models.crm import Contact, Lead, Opportunity
from ..models.crm.agent_portal import AgentEarnedBadge, AgentSalesTarget
from ..models.invoices import Invoice, Payment
from ..config.installment_models import Installment, InstallmentPlan
from ..config.core_models import User
from .contact_financials import resolve_date_range


BADGE_DEFS = {
    "first_close": {"icon": "◆", "label": "First Close", "description": "First deal closed"},
    "hot_streak": {"icon": "▲", "label": "Hot Streak", "description": "3 consecutive deals closed"},
    "big_deal": {"icon": "★", "label": "Big Deal", "description": "Deal over $300"},
    "speed_closer": {"icon": "●", "label": "Speed Closer", "description": "Move 5 leads to contacted stage"},
    "qualifier": {"icon": "◈", "label": "Qualifier", "description": "Qualify 3 leads"},
    "champion": {"icon": "♦", "label": "Champion", "description": "Achieve 100% monthly target"},
    "fast_payer": {"icon": "⚡", "label": "Fast Payer", "description": "3 installments paid within 7 days of due date"},
}

LEVEL_DEFS = [
    {"key": "beginner", "icon": "◎", "label": "Beginner", "minPct": 0},
    {"key": "pro", "icon": "◈", "label": "Pro", "minPct": 25},
    {"key": "closer", "icon": "◆", "label": "Closer", "minPct": 60},
    {"key": "champion", "icon": "★", "label": "Champion", "minPct": 90},
]

MILESTONE_DEFS = [
    {"pct": 10, "icon": "◎", "label": "Great start"},
    {"pct": 25, "icon": "◈", "label": "Pro unlocked"},
    {"pct": 50, "icon": "▲", "label": "Halfway"},
    {"pct": 75, "icon": "◆", "label": "Near Champion"},
    {"pct": 100, "icon": "★", "label": "Target Achieved"},
]


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _agent_opportunity_ids(db: Session, tenant_id: str, user_id: str) -> List[str]:
    uid = uuid.UUID(str(user_id))
    tid = uuid.UUID(str(tenant_id))
    rows = db.query(Opportunity.id).filter(
        Opportunity.tenant_id == tid,
        Opportunity.assignedToId == uid,
    ).all()
    return [str(r[0]) for r in rows]


def _paid_in_date_range(
    db: Session,
    tenant_id: str,
    user_id: str,
    start: Optional[datetime],
    end: Optional[datetime],
) -> float:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    opp_ids = _agent_opportunity_ids(db, tenant_id, user_id)
    contact_id_rows = db.query(Contact.id).filter(
        Contact.tenant_id == tid,
        Contact.assignedToId == uid,
    ).all()
    contact_ids = [r[0] for r in contact_id_rows]
    link_parts = [Invoice.createdBy == uid]
    if opp_ids:
        link_parts.append(Invoice.opportunityId.in_(opp_ids))
    if contact_ids:
        link_parts.append(Invoice.contactId.in_(contact_ids))
    q = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).join(
        Invoice, Payment.invoiceId == Invoice.id
    ).filter(
        Payment.tenant_id == tid,
        Payment.status == "completed",
        or_(*link_parts),
    )
    if start:
        q = q.filter(Payment.paymentDate >= start)
    if end:
        q = q.filter(Payment.paymentDate < end)
    return float(q.scalar() or 0.0)


def _agent_closed_deals(
    db: Session,
    tenant_id: str,
    user_id: str,
    start: Optional[datetime],
    end: Optional[datetime],
) -> List[Opportunity]:
    uid = uuid.UUID(str(user_id))
    tid = uuid.UUID(str(tenant_id))
    q = db.query(Opportunity).filter(
        Opportunity.tenant_id == tid,
        Opportunity.assignedToId == uid,
        Opportunity.stage == "closed_won",
    )
    if start:
        q = q.filter(or_(Opportunity.closedDate >= start, Opportunity.updatedAt >= start))
    if end:
        q = q.filter(or_(Opportunity.closedDate < end, Opportunity.updatedAt < end))
    return q.all()


def get_monthly_target(db: Session, tenant_id: str, user_id: str, year: int, month: int) -> float:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    row = db.query(AgentSalesTarget).filter(
        AgentSalesTarget.tenant_id == tid,
        AgentSalesTarget.userId == uid,
        AgentSalesTarget.year == year,
        AgentSalesTarget.month == month,
    ).first()
    return float(row.targetAmount) if row else 10000.0


def _installment_completion_rate(db: Session, tenant_id: str, user_id: str) -> float:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    contact_ids = [
        r[0] for r in db.query(Contact.id).filter(
            Contact.tenant_id == tid, Contact.assignedToId == uid
        ).all()
    ]
    if not contact_ids:
        return 0.0
    invoices = db.query(Invoice.id).filter(
        Invoice.tenant_id == tid,
        Invoice.contactId.in_(contact_ids),
    ).all()
    invoice_ids = [r[0] for r in invoices]
    if not invoice_ids:
        return 0.0
    plans = db.query(InstallmentPlan.id).filter(
        InstallmentPlan.tenant_id == tid,
        InstallmentPlan.invoice_id.in_(invoice_ids),
    ).all()
    plan_ids = [r[0] for r in plans]
    if not plan_ids:
        return 0.0
    installments = db.query(Installment).filter(
        Installment.tenant_id == tid,
        Installment.installment_plan_id.in_(plan_ids),
    ).all()
    if not installments:
        return 0.0
    paid = sum(1 for i in installments if i.status == "paid")
    return round(paid / len(installments) * 100, 1)


def _fast_payer_count(db: Session, tenant_id: str, user_id: str) -> int:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    contact_ids = [
        r[0] for r in db.query(Contact.id).filter(
            Contact.tenant_id == tid, Contact.assignedToId == uid
        ).all()
    ]
    if not contact_ids:
        return 0
    invoices = db.query(Invoice.id).filter(
        Invoice.tenant_id == tid, Invoice.contactId.in_(contact_ids)
    ).all()
    invoice_ids = [r[0] for r in invoices]
    if not invoice_ids:
        return 0
    plans = db.query(InstallmentPlan).filter(
        InstallmentPlan.tenant_id == tid,
        InstallmentPlan.invoice_id.in_(invoice_ids),
    ).all()
    plan_ids = [p.id for p in plans]
    if not plan_ids:
        return 0
    fast = 0
    for inst in db.query(Installment).filter(
        Installment.tenant_id == tid,
        Installment.installment_plan_id.in_(plan_ids),
        Installment.status == "paid",
    ).all():
        if inst.updated_at and inst.due_date:
            delta = (inst.updated_at - inst.due_date).days
            if delta <= 7:
                fast += 1
    return fast


def compute_level(target_pct: float, installment_pct: float = 0.0) -> Dict[str, Any]:
    combined = target_pct * 0.6 + installment_pct * 0.4
    current = LEVEL_DEFS[0]
    for lvl in LEVEL_DEFS:
        if combined >= lvl["minPct"]:
            current = lvl
    next_lvl = None
    for lvl in LEVEL_DEFS:
        if lvl["minPct"] > combined:
            next_lvl = lvl
            break
    return {
        "current": current,
        "next": next_lvl,
        "progressPct": round(min(combined, 100.0), 1),
        "targetAchievementPct": round(target_pct, 1),
        "installmentCompletionPct": round(installment_pct, 1),
    }


def evaluate_badges(db: Session, tenant_id: str, user_id: str) -> Dict[str, bool]:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    closed = db.query(Opportunity).filter(
        Opportunity.tenant_id == tid,
        Opportunity.assignedToId == uid,
        Opportunity.stage == "closed_won",
    ).order_by(desc(Opportunity.closedDate)).all()
    closed_sorted = sorted(closed, key=lambda o: o.closedDate or o.updatedAt or datetime.min)

    badges: Dict[str, bool] = {
        "first_close": len(closed) >= 1,
        "big_deal": any(float(o.wonAmount or o.amount or 0) > 300 for o in closed),
        "hot_streak": False,
        "speed_closer": db.query(Lead).filter(
            Lead.tenant_id == tid,
            Lead.assignedToId == uid,
            Lead.status == "contacted",
        ).count() >= 5,
        "qualifier": db.query(Lead).filter(
            Lead.tenant_id == tid,
            Lead.assignedToId == uid,
            Lead.status == "qualified",
        ).count() >= 3,
        "champion": False,
        "fast_payer": _fast_payer_count(db, tenant_id, user_id) >= 3,
    }

    streak = 0
    max_streak = 0
    for o in closed_sorted:
        streak += 1
        max_streak = max(max_streak, streak)
    badges["hot_streak"] = max_streak >= 3

    now = datetime.utcnow()
    month_paid = _paid_in_date_range(
        db, tenant_id, user_id,
        datetime(now.year, now.month, 1),
        None,
    )
    target = get_monthly_target(db, tenant_id, user_id, now.year, now.month)
    if target > 0 and month_paid >= target:
        badges["champion"] = True

    return badges


def persist_new_badges(db: Session, tenant_id: str, user_id: str, badges: Dict[str, bool]) -> None:
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    existing = {
        r.badgeKey
        for r in db.query(AgentEarnedBadge).filter(
            AgentEarnedBadge.tenant_id == tid,
            AgentEarnedBadge.userId == uid,
        ).all()
    }
    for key, earned in badges.items():
        if earned and key not in existing:
            db.add(AgentEarnedBadge(tenant_id=tid, userId=uid, badgeKey=key))
    db.commit()


def get_agent_overview(
    db: Session,
    tenant_id: str,
    user_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    start, end = resolve_date_range(quick_filter, _parse_dt(date_from), _parse_dt(date_to))
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    earnings = _paid_in_date_range(db, tenant_id, user_id, start, end)
    month_earnings = _paid_in_date_range(db, tenant_id, user_id, month_start, None)
    target = get_monthly_target(db, tenant_id, user_id, now.year, now.month)
    target_pct = (month_earnings / target * 100) if target > 0 else 0.0
    installment_pct = _installment_completion_rate(db, tenant_id, user_id)
    level = compute_level(target_pct, installment_pct)
    closed = _agent_closed_deals(db, tenant_id, user_id, start, end)
    deal_closed_value = sum(float(o.wonAmount or o.amount or 0) for o in closed)
    pending = max(deal_closed_value - earnings, 0.0) if deal_closed_value else 0.0
    win_rate = (earnings / deal_closed_value * 100) if deal_closed_value > 0 else 0.0
    badges = evaluate_badges(db, tenant_id, user_id)
    persist_new_badges(db, tenant_id, user_id, badges)
    return {
        "totalEarnings": round(earnings, 2),
        "dealsClosed": len(closed),
        "dealClosedValue": round(deal_closed_value, 2),
        "pendingInstallments": round(pending, 2),
        "targetAchievementPct": round(target_pct, 1),
        "remainingTargetAmount": round(max(target - month_earnings, 0.0), 2),
        "monthlyTarget": round(target, 2),
        "averageDealValue": round(deal_closed_value / len(closed), 2) if closed else 0.0,
        "biggestDeal": round(max((float(o.wonAmount or o.amount or 0) for o in closed), default=0.0), 2),
        "winRatePct": round(win_rate, 1),
        "level": level,
        "openLeads": db.query(Lead).filter(
            Lead.tenant_id == uuid.UUID(str(tenant_id)),
            Lead.assignedToId == uuid.UUID(str(user_id)),
            Lead.status.notin_(["won", "lost"]),
        ).count(),
        "openOpportunities": db.query(Opportunity).filter(
            Opportunity.tenant_id == uuid.UUID(str(tenant_id)),
            Opportunity.assignedToId == uuid.UUID(str(user_id)),
            Opportunity.stage.notin_(["closed_won", "closed_lost"]),
        ).count(),
    }


def get_agent_earnings(
    db: Session,
    tenant_id: str,
    user_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    overview = get_agent_overview(db, tenant_id, user_id, date_from, date_to, quick_filter)
    clients = get_earnings_by_client(db, tenant_id, user_id, date_from, date_to, quick_filter)
    return {**overview, "clients": clients}


def get_earnings_by_client(
    db: Session,
    tenant_id: str,
    user_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    start, end = resolve_date_range(quick_filter, _parse_dt(date_from), _parse_dt(date_to))
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    contacts = db.query(Contact).filter(
        Contact.tenant_id == tid,
        Contact.assignedToId == uid,
    ).all()
    rows: List[Dict[str, Any]] = []
    total_paid = 0.0
    for c in contacts:
        opps = db.query(Opportunity).filter(
            Opportunity.tenant_id == tid,
            Opportunity.contactId == c.id,
            Opportunity.stage == "closed_won",
        ).all()
        deal_value = sum(float(o.wonAmount or o.amount or 0) for o in opps)
        source = opps[0].leadSource if opps else (c.contactSource or "—")
        inv_q = db.query(Invoice).filter(
            Invoice.tenant_id == tid,
            or_(
                Invoice.contactId == c.id,
                func.lower(func.coalesce(Invoice.customerEmail, "")) == (c.email or "").strip().lower(),
            ),
        )
        invoices = inv_q.all()
        paid = sum(float(i.totalPaid or 0) for i in invoices)
        remaining = sum(float(i.balance or 0) for i in invoices)
        if not invoices and deal_value:
            remaining = max(deal_value - paid, 0.0)
        if start or end:
            pay_q = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).join(
                Invoice, Payment.invoiceId == Invoice.id
            ).filter(
                Payment.tenant_id == tid,
                Payment.status == "completed",
                or_(
                    Invoice.contactId == c.id,
                    func.lower(func.coalesce(Invoice.customerEmail, "")) == (c.email or "").strip().lower(),
                ),
            )
            if start:
                pay_q = pay_q.filter(Payment.paymentDate >= start)
            if end:
                pay_q = pay_q.filter(Payment.paymentDate < end)
            paid = float(pay_q.scalar() or 0.0)
        if deal_value <= 0 and paid <= 0:
            continue
        total_paid += paid
        rows.append({
            "contactId": str(c.id),
            "clientName": f"{c.firstName} {c.lastName}".strip(),
            "source": source or "—",
            "dealValue": round(deal_value, 2),
            "paidAmount": round(paid, 2),
            "remainingBalance": round(remaining, 2),
            "contributionPct": 0.0,
        })
    if total_paid > 0:
        for r in rows:
            r["contributionPct"] = round(r["paidAmount"] / total_paid * 100, 1)
    return rows


def get_agent_achievements(db: Session, tenant_id: str, user_id: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    month_earnings = _paid_in_date_range(
        db, tenant_id, user_id,
        datetime(now.year, now.month, 1),
        None,
    )
    target = get_monthly_target(db, tenant_id, user_id, now.year, now.month)
    target_pct = (month_earnings / target * 100) if target > 0 else 0.0
    installment_pct = _installment_completion_rate(db, tenant_id, user_id)
    badges_state = evaluate_badges(db, tenant_id, user_id)
    persist_new_badges(db, tenant_id, user_id, badges_state)
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    earned_rows = {
        r.badgeKey: r.earnedAt
        for r in db.query(AgentEarnedBadge).filter(
            AgentEarnedBadge.tenant_id == tid,
            AgentEarnedBadge.userId == uid,
        ).all()
    }
    badges = []
    for key, meta in BADGE_DEFS.items():
        badges.append({
            "key": key,
            "icon": meta["icon"],
            "label": meta["label"],
            "description": meta["description"],
            "earned": badges_state.get(key, False),
            "earnedAt": earned_rows[key].isoformat() if key in earned_rows else None,
        })
    milestones = []
    for m in MILESTONE_DEFS:
        milestones.append({
            "pct": m["pct"],
            "icon": m["icon"],
            "label": m["label"],
            "unlocked": target_pct >= m["pct"],
        })
    return {
        "badges": badges,
        "milestones": milestones,
        "level": compute_level(target_pct, installment_pct),
        "targetAchievementPct": round(target_pct, 1),
    }


def get_agent_pipeline(
    db: Session,
    tenant_id: str,
    user_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    start, end = resolve_date_range(quick_filter, _parse_dt(date_from), _parse_dt(date_to))
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
    pipeline = []
    for stage in stages:
        q = db.query(Opportunity).filter(
            Opportunity.tenant_id == tid,
            Opportunity.assignedToId == uid,
            Opportunity.stage == stage,
        )
        if start:
            q = q.filter(Opportunity.updatedAt >= start)
        if end:
            q = q.filter(Opportunity.updatedAt < end)
        count = q.count()
        amount = db.query(func.coalesce(func.sum(Opportunity.amount), 0.0)).filter(
            Opportunity.tenant_id == tid,
            Opportunity.assignedToId == uid,
            Opportunity.stage == stage,
        )
        if start:
            amount = amount.filter(Opportunity.updatedAt >= start)
        if end:
            amount = amount.filter(Opportunity.updatedAt < end)
        pipeline.append({"stage": stage, "count": count, "amount": round(float(amount.scalar() or 0), 2)})
    return {"pipeline": pipeline}


def get_agent_leads(
    db: Session,
    tenant_id: str,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    start, end = resolve_date_range(quick_filter, _parse_dt(date_from), _parse_dt(date_to))
    tid = uuid.UUID(str(tenant_id))
    uid = uuid.UUID(str(user_id))
    q = db.query(Lead).filter(Lead.tenant_id == tid, Lead.assignedToId == uid)
    if start:
        q = q.filter(Lead.updatedAt >= start)
    if end:
        q = q.filter(Lead.updatedAt < end)
    total = q.count()
    skip = (page - 1) * limit
    rows = q.order_by(desc(Lead.createdAt)).offset(skip).limit(limit).all()
    leads = []
    for l in rows:
        leads.append({
            "id": str(l.id),
            "firstName": l.firstName,
            "lastName": l.lastName,
            "email": l.email,
            "company": l.company,
            "status": l.status,
            "leadSource": l.leadSource,
            "createdAt": l.createdAt.isoformat() if l.createdAt else None,
        })
    return {"leads": leads, "total": total, "page": page, "limit": limit}


def _user_display(db: Session, user_id) -> str:
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        return str(user_id)
    name = f"{getattr(u, 'firstName', '') or ''} {getattr(u, 'lastName', '') or ''}".strip()
    return name or getattr(u, "userName", None) or getattr(u, "email", str(user_id))


def get_team_analytics(
    db: Session,
    tenant_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    tid = uuid.UUID(str(tenant_id))
    agent_ids = set()
    for row in db.query(Opportunity.assignedToId).filter(
        Opportunity.tenant_id == tid, Opportunity.assignedToId.isnot(None)
    ).distinct().all():
        agent_ids.add(row[0])
    for row in db.query(Lead.assignedToId).filter(
        Lead.tenant_id == tid, Lead.assignedToId.isnot(None)
    ).distinct().all():
        agent_ids.add(row[0])
    members = []
    for aid in agent_ids:
        uid = str(aid)
        overview = get_agent_overview(db, tenant_id, uid, date_from, date_to, quick_filter)
        members.append({
            "userId": uid,
            "name": _user_display(db, aid),
            **overview,
        })
    members.sort(key=lambda m: m.get("totalEarnings", 0), reverse=True)
    return {"members": members, "total": len(members)}


def get_leaderboard(
    db: Session,
    tenant_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
) -> Dict[str, Any]:
    team = get_team_analytics(db, tenant_id, date_from, date_to, quick_filter)
    rows = []
    for rank, m in enumerate(team["members"], start=1):
        rows.append({
            "rank": rank,
            "userId": m["userId"],
            "name": m["name"],
            "totalEarnings": m["totalEarnings"],
            "dealsClosed": m["dealsClosed"],
            "targetAchievementPct": m["targetAchievementPct"],
            "level": m["level"],
        })
    return {"leaderboard": rows}


def get_sales_targets(db: Session, tenant_id: str, year: Optional[int] = None, month: Optional[int] = None):
    tid = uuid.UUID(str(tenant_id))
    q = db.query(AgentSalesTarget).filter(AgentSalesTarget.tenant_id == tid)
    if year:
        q = q.filter(AgentSalesTarget.year == year)
    if month:
        q = q.filter(AgentSalesTarget.month == month)
    rows = q.all()
    return {
        "targets": [
            {
                "userId": str(r.userId),
                "name": _user_display(db, r.userId),
                "year": r.year,
                "month": r.month,
                "targetAmount": float(r.targetAmount),
            }
            for r in rows
        ]
    }
