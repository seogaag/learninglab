"""Reset admin password (for existing admin)"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.admin import Admin

def reset_password(username: str, new_password: str) -> bool:
    db: Session = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == username).first()
        if not admin:
            print(f"Admin '{username}' not found.")
            return False
        admin.password_hash = Admin.hash_password(new_password)
        db.commit()
        print(f"Password reset successfully for '{username}'.")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_admin_password.py <username> <new_password>")
        print("Example: python reset_admin_password.py julie-gpc 'mypass123'")
        sys.exit(1)
    username = sys.argv[1]
    password = sys.argv[2]
    reset_password(username, password)
