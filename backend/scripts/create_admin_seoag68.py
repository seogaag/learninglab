"""관리자 계정 생성 스크립트 (seoag68)"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.admin import Admin

def create_admin():
    """관리자 계정 생성"""
    db: Session = SessionLocal()
    try:
        # 기존 관리자 확인
        existing = db.query(Admin).filter(Admin.username == 'seoag68').first()
        if existing:
            print("Admin 'seoag68' already exists. Updating password...")
            existing.password_hash = Admin.hash_password('seoag68**')
            db.commit()
            print("Password updated successfully!")
            return True
        
        # 새 관리자 생성
        password_hash = Admin.hash_password('seoag68**')
        admin = Admin(
            username='seoag68',
            password_hash=password_hash,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Admin 'seoag68' created successfully!")
        return True
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
