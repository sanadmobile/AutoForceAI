from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.dependencies import get_db
from database.models import DigitalEmployee, Mission, MissionTask, Project, AgentRole, EmployeeSkill
from core.agents.planner import MissionPlanner
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/agents", tags=["digital-employees"])

# --- Pydantic Schemas ---
class AgentSkillCreate(BaseModel):
    tool_name: str
    config: Optional[dict] = {}

class AgentCreate(BaseModel):
    name: str
    role: str # strategist, executor, archivist
    description: str
    system_prompt: Optional[str] = ""
    capabilities: List[str] = []
    skills: List[AgentSkillCreate] = []

class MissionCreate(BaseModel):
    employee_id: int
    title: str
    objective: str

# --- Endpoints ---

@router.post("/{project_id}/employees")
def create_employee(project_id: int, agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = DigitalEmployee(
        project_id=project_id,
        name=agent.name,
        role=agent.role,
        description=agent.description,
        system_prompt=agent.system_prompt,
        capabilities=agent.capabilities
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    # Create Skills
    for skill in agent.skills:
        db.add(EmployeeSkill(
            employee_id=db_agent.id,
            tool_name=skill.tool_name,
            config=skill.config
        ))
    
    if agent.skills:
        db.commit()
        db.refresh(db_agent)
        
    return db_agent

@router.get("/{project_id}/employees")
def list_employees(project_id: int, db: Session = Depends(get_db)):
    return db.query(DigitalEmployee).filter(DigitalEmployee.project_id == project_id).all()

@router.post("/missions")
def create_mission(mission: MissionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Create Mission Record
    emp = db.query(DigitalEmployee).get(mission.employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Agent not found")

    db_mission = Mission(
        project_id=emp.project_id,
        assigned_to=mission.employee_id,
        title=mission.title,
        objective=mission.objective
    )
    
    db.add(db_mission)
    db.commit()
    db.refresh(db_mission)
    
    # 2. Trigger Planning (Sync for Demo responsiveness)
    # In production, use Celery or BackgroundTasks with a fresh DB session
    planner = MissionPlanner(db)
    
    try:
        planner.create_plan(db_mission.id)
        # Refresh to get the tasks loaded
        db.refresh(db_mission) 
    except Exception as e:
        print(f"Planning failed: {e}")
        # We process error internally but return the mission so user sees it created
    
    return db_mission

@router.get("/missions/{mission_id}")
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    return {
        "mission": {
            "id": mission.id,
            "title": mission.title,
            "objective": mission.objective,
            "status": mission.status,
            "plan_summary": mission.plan_summary,
            "assigned_to": mission.assigned_to
        },
        "tasks": mission.tasks
    }

@router.get("/{project_id}/missions")
def list_project_missions(project_id: int, db: Session = Depends(get_db)):
    return db.query(Mission).filter(Mission.project_id == project_id).all()
