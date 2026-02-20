"""관리자 계정 생성 스크립트"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.admin import Admin

def create_admin(username: str, password: str, email: str = None, name: str = None):
    """관리자 계정 생성"""
    db: Session = SessionLocal()
    try:
        # 기존 관리자 확인
        existing = db.query(Admin).filter(Admin.username == username).first()
        if existing:
            print(f"Admin '{username}' already exists.")
            return False
        
        # 새 관리자 생성
        try:
            password_hash = Admin.hash_password(password)
        except Exception as e:
            print(f"Password hash creation error: {e}")
            # 직접 bcrypt 사용
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            password_hash = pwd_context.hash(password)
        
        admin = Admin(
            username=username,
            password_hash=password_hash,
            email=email,
            name=name,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print(f"Admin '{username}' created successfully.")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <username> <password> [email] [name]")
        print("       python create_admin.py <username> <password> --reset  (reset password if exists)")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    reset_mode = len(sys.argv) > 3 and sys.argv[3] == "--reset"
    if reset_mode:
        db = SessionLocal()
        try:
            admin = db.query(Admin).filter(Admin.username == username).first()
            if not admin:
                print(f"Admin '{username}' not found.")
            else:
                admin.password_hash = Admin.hash_password(password)
                db.commit()
                print(f"Password reset successfully for '{username}'.")
        except Exception as e:
            db.rollback()
            print(f"Error: {e}")
        finally:
            db.close()
    else:
        email = sys.argv[3] if len(sys.argv) > 3 else None
        name = sys.argv[4] if len(sys.argv) > 4 else None
        create_admin(username, password, email, name)
