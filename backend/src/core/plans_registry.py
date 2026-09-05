from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class Plan:
    key: str
    name: str
    plan_type: str
    price: float
    billing_cycle: str
    max_projects: int
    max_users: int
    features: List[str]
    modules: List[str] = field(default_factory=list)

    @property
    def planType(self) -> str:
        return self.plan_type

    @property
    def maxProjects(self) -> int:
        return self.max_projects

    @property
    def maxUsers(self) -> int:
        return self.max_users

    @property
    def billingCycle(self) -> str:
        return self.billing_cycle


PLANS = {
    "agency": Plan(
        key="agency",
        name="Agency Pro",
        plan_type="agency",
        price=49,
        billing_cycle="monthly",
        max_projects=20,
        max_users=5,
        features=["Unlimited projects", "Team collaboration", "CRM & Sales", "Invoicing"],
        modules=["projects", "crm", "invoices", "sales"],
    ),
    "commerce": Plan(
        key="commerce",
        name="Commerce Pro",
        plan_type="commerce",
        price=49,
        billing_cycle="monthly",
        max_projects=20,
        max_users=5,
        features=["POS", "Inventory", "Invoicing", "Reports"],
        modules=["pos", "inventory", "invoices", "reports"],
    ),
    "workshop": Plan(
        key="workshop",
        name="Workshop Master",
        plan_type="workshop",
        price=39,
        billing_cycle="monthly",
        max_projects=10,
        max_users=5,
        features=["Job cards", "Vehicles", "MOT", "Quality control"],
        modules=["job_cards", "vehicles", "metrods", "quality_control"],
    ),
    "ngo": Plan(
        key="ngo",
        name="NGO Impact",
        plan_type="ngo",
        price=29,
        billing_cycle="monthly",
        max_projects=10,
        max_users=5,
        features=["Donations", "Projects", "Reports"],
        modules=["projects", "ngos", "reports"],
    ),
    "healthcare": Plan(
        key="healthcare",
        name="Healthcare Suite",
        plan_type="healthcare",
        price=59,
        billing_cycle="monthly",
        max_projects=10,
        max_users=10,
        features=["Appointments", "Patients", "Prescriptions"],
        modules=["healthcare", "appointments", "prescriptions"],
    ),
    "lms": Plan(
        key="lms",
        name="LMS Suite",
        plan_type="lms",
        price=39,
        billing_cycle="monthly",
        max_projects=10,
        max_users=10,
        features=["Courses", "Students", "Reports"],
        modules=["lms", "courses"],
    ),
}


def plan_to_dict(plan: "Plan") -> Dict[str, Any]:
    return {
        "name": plan.name,
        "description": plan.name,
        "planType": plan.plan_type,
        "price": plan.price,
        "billingCycle": plan.billing_cycle,
        "maxProjects": plan.max_projects,
        "maxUsers": plan.max_users,
        "features": plan.features,
        "modules": plan.modules,
    }
