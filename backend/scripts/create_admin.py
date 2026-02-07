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
            print(f"❌ 관리자 '{username}'가 이미 존재합니다.")
            return False
        
        # 새 관리자 생성
        try:
            password_hash = Admin.hash_password(password)
        except Exception as e:
            print(f"❌ 비밀번호 해시 생성 오류: {e}")
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
        print(f"✅ 관리자 '{username}'가 성공적으로 생성되었습니다.")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("사용법: python create_admin.py <username> <password> [email] [name]")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    email = sys.argv[3] if len(sys.argv) > 3 else None
    name = sys.argv[4] if len(sys.argv) > 4 else None
    
    create_admin(username, password, email, name)
