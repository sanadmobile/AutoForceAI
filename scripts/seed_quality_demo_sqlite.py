import sys
import os
import random
from datetime import datetime, timedelta
# from dotenv import load_dotenv

# Ensure we load the environment variables from the correct location
# env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
# load_dotenv(env_path)

# Add path to find 'core' and 'database'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.db_manager import SHARED_ENGINE, SharedSessionLocal
from database.base import Base

# Import all models to ensure they are registered with Base.metadata
from database.shared_models import Organization, User, QualityRule, InspectionRecord
from database.models import Project, DigitalEmployee, ChatSession, ChatMessage, AgentRole

def seed():
    print("[-] Seeding Full Demo Data (SQLite)...")
    
    try:
        # 1. Create Tables
        print(f"Tables to create: {list(Base.metadata.tables.keys())}")
        Base.metadata.create_all(bind=SHARED_ENGINE)
        
        db = SharedSessionLocal()
    
        # 2. Check/Create Organization
        org = db.query(Organization).filter_by(name="Demo Corp").first()
        if not org:
            org = Organization(name="Demo Corp", description="A demo organization")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Created Organization: {org.name}")
        
        # 3. Check/Create User
        user = db.query(User).filter_by(username="demo_admin").first()
        if not user:
            user = User(
                username="demo_admin", 
                email="admin@demo.com", 
                nickname="Admin User"
                # organization_id relationship is intricate in shared_models, skipping explicit link for now if not rigid
            )
            # If Organization relation is needed, we'd add it. Assuming loose coupling for now or User table doesn't have org_id directly (check schema later)
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created User: {user.username}")

        # 4. Check/Create Project
        project = db.query(Project).filter_by(name="Customer Service AI").first()
        if not project:
            project = Project(
                name="Customer Service AI",
                user_id=user.id,
                description="AI Customer Support Project"
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"Created Project: {project.name}")

        # 5. Check/Create DigitalEmployee (Bot)
        bot = db.query(DigitalEmployee).filter_by(name="Support Bot Alpha").first()
        if not bot:
            bot = DigitalEmployee(
                name="Support Bot Alpha",
                project_id=project.id,
                role=AgentRole.EXECUTOR, # Fallback to existing role to avoid DB Enum migration
                system_prompt="You are a helpful assistant."
            )
            db.add(bot)
            db.commit()
            db.refresh(bot)
            print(f"Created Bot: {bot.name}")

        # 6. Create Chat Sessions and Messages (if none exist)
        session_count = db.query(ChatSession).count()
        if session_count < 5:
            print("Creating dummy chat sessions...")
            
            # Scenario 1: Good Interaction
            s1 = ChatSession(
                session_uuid=f"sess_{random.randint(1000,9999)}",
                project_id=project.id,
                employee_id=bot.id,
                visitor_id="visitor_101",
                created_at=datetime.now() - timedelta(hours=2)
            )
            db.add(s1)
            db.flush()
            
            msgs1 = [
                ChatMessage(session_id=s1.id, role="user", content="Return policy for shoes?", created_at=s1.created_at),
                ChatMessage(session_id=s1.id, role="assistant", content="You can return shoes within 30 days if unworn.", created_at=s1.created_at + timedelta(seconds=2))
            ]
            db.add_all(msgs1)

            # Scenario 2: Bad Interaction (Rude)
            s2 = ChatSession(
                session_uuid=f"sess_{random.randint(1000,9999)}",
                project_id=project.id,
                employee_id=bot.id,
                visitor_id="visitor_102",
                created_at=datetime.now() - timedelta(hours=1)
            )
            db.add(s2)
            db.flush()
            
            msgs2 = [
                ChatMessage(session_id=s2.id, role="user", content="Where is my order? It's been a week!", created_at=s2.created_at),
                ChatMessage(session_id=s2.id, role="assistant", content="I don't know. Check the website yourself.", created_at=s2.created_at + timedelta(seconds=3))
            ]
            db.add_all(msgs2)

            # Scenario 3: Hallucination
            s3 = ChatSession(
                session_uuid=f"sess_{random.randint(1000,9999)}",
                project_id=project.id,
                employee_id=bot.id,
                visitor_id="visitor_103",
                created_at=datetime.now() - timedelta(minutes=30)
            )
            db.add(s3)
            db.flush()
            
            msgs3 = [
                ChatMessage(session_id=s3.id, role="user", content="Do you sell flying cars?", created_at=s3.created_at),
                ChatMessage(session_id=s3.id, role="assistant", content="Yes, we sell the Nimbus 2000 flying car for $500.", created_at=s3.created_at + timedelta(seconds=5))
            ]
            db.add_all(msgs3)

            db.commit()
            print("Created 3 dummy sessions with messages.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
