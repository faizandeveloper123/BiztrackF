from typing import List, Optional

RETAIL_PLAN_TYPES = frozenset({"commerce", "agency"})

PLAN_EXCLUDED_MODULES = {
    "agency": frozenset({"pos"}),
}


def is_retail_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() in RETAIL_PLAN_TYPES


def is_commerce_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() == "commerce"


def is_agency_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() == "agency"


def get_plan_excluded_modules(plan_type: Optional[str]) -> frozenset[str]:
    return PLAN_EXCLUDED_MODULES.get((plan_type or "").lower(), frozenset())


def is_module_excluded_for_plan(plan_type: Optional[str], module: str) -> bool:
    return module in get_plan_excluded_modules(plan_type)


def filter_permissions_for_plan(
    permissions: List[str],
    plan_type: Optional[str],
) -> List[str]:
    excluded = get_plan_excluded_modules(plan_type)
    if not excluded:
        return permissions
    return [p for p in permissions if p.split(":")[0] not in excluded]


def filter_modules_for_plan(
    modules: List[str],
    plan_type: Optional[str],
) -> List[str]:
    excluded = get_plan_excluded_modules(plan_type)
    if not excluded:
        return modules
    return [m for m in modules if m not in excluded]
