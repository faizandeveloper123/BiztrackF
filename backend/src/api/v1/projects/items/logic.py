from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_
from .....models.projects import Project, Task
from .....config.core_models import project_team_members
from .....core.cache import cached_sync

def get_project_by_id(project_id: str, db: Session, tenant_id: str = None) -> Optional[Project]:
    query = db.query(Project).filter(Project.id == project_id)
    if tenant_id:
        query = query.filter(Project.tenant_id == tenant_id)
    return query.first()

def get_all_projects(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Project]:
    query = db.query(Project)
    if tenant_id:
        query = query.filter(Project.tenant_id == tenant_id)
    return query.order_by(Project.createdAt.desc()).offset(skip).limit(limit).all()

def get_projects_by_manager(manager_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Project]:
    query = db.query(Project).filter(Project.projectManagerId == manager_id)
    if tenant_id:
        query = query.filter(Project.tenant_id == tenant_id)
    return query.order_by(Project.createdAt.desc()).offset(skip).limit(limit).all()

def get_project_ids_with_tasks_assigned_to(user_id: str, db: Session, tenant_id: str = None) -> List[Any]:
    ids = set()
    task_q = db.query(Task.projectId).filter(
        or_(Task.assignedToId == user_id, Task.createdById == user_id)
    )
    if tenant_id:
        task_q = task_q.filter(Task.tenant_id == tenant_id)
    for row in task_q.distinct().all():
        ids.add(row[0])
    pm_q = db.query(Project.id).filter(Project.projectManagerId == user_id)
    if tenant_id:
        pm_q = pm_q.filter(Project.tenant_id == tenant_id)
    for row in pm_q.all():
        ids.add(row[0])
    team_q = db.query(project_team_members.c.project_id).join(
        Project, Project.id == project_team_members.c.project_id
    ).filter(project_team_members.c.user_id == user_id)
    if tenant_id:
        team_q = team_q.filter(Project.tenant_id == tenant_id)
    for row in team_q.all():
        ids.add(row[0])
    created_q = db.query(Project.id).filter(Project.createdById == user_id)
    if tenant_id:
        created_q = created_q.filter(Project.tenant_id == tenant_id)
    for row in created_q.all():
        ids.add(row[0])
    return list(ids)

def create_project(project_data: dict, db: Session) -> Project:
    db_project = Project(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(project_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Project]:
    project = get_project_by_id(project_id, db, tenant_id)
    if project:
        for key, value in update_data.items():
            if hasattr(project, key) and value is not None:
                setattr(project, key, value)
        project.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(project)
    return project

def delete_project(project_id: str, db: Session, tenant_id: str = None) -> bool:
    project = get_project_by_id(project_id, db, tenant_id)
    if project:
        from .....config.hrm_models import TimeEntry
        time_entries = db.query(TimeEntry).filter(
            TimeEntry.projectId == project_id,
            TimeEntry.tenant_id == tenant_id
        ).all()
        
        for time_entry in time_entries:
            time_entry.projectId = None
        
        tasks = db.query(Task).filter(
            Task.projectId == project_id,
            Task.tenant_id == tenant_id
        ).all()
        
        for task in tasks:
            task_time_entries = db.query(TimeEntry).filter(
                TimeEntry.taskId == str(task.id),
                TimeEntry.tenant_id == tenant_id
            ).all()
            
            for time_entry in task_time_entries:
                time_entry.taskId = None
            
            db.delete(task)
        
        from .....config.core_models import project_team_members
        db.execute(project_team_members.delete().where(project_team_members.c.project_id == project_id))
        
        db.delete(project)
        db.commit()
        return True
    return False

@cached_sync(ttl=60, key_prefix="project_stats_")
def get_project_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    # Single optimized query using CASE statements
    result = db.query(
        func.count(Project.id).label('total'),
        func.sum(case([(Project.status.in_(["planning", "in_progress"]), 1)], else_=0)).label('active'),
        func.sum(case([(Project.status == "completed", 1)], else_=0)).label('completed'),
        func.sum(case([(Project.status == "on_hold", 1)], else_=0)).label('on_hold')
    ).filter(Project.tenant_id == tenant_id).first()
    
    return {
        "total": result.total or 0,
        "active": result.active or 0,
        "completed": result.completed or 0,
        "on_hold": result.on_hold or 0
    }

