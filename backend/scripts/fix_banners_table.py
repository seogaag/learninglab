"""banners 테이블 수정 스크립트"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine

def fix_table():
    """banners 테이블에 order 컬럼 추가"""
    with engine.connect() as conn:
        try:
            # order 컬럼 추가 (PostgreSQL 예약어이므로 따옴표 필요)
            conn.execute(text('ALTER TABLE banners ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0'))
            conn.commit()
            print("✅ banners 테이블에 'order' 컬럼이 추가되었습니다.")
            return True
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    fix_table()
