"""alembic_version을 001로 맞추고 posts에 누락된 컬럼 추가 (002_sequences 오류 해결용)"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine

def main():
    with engine.begin() as conn:
        # 1. alembic_version을 001로 설정 (002_sequences 등 잘못된 버전 해결)
        conn.execute(text("DELETE FROM alembic_version"))
        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('001')"))
        # 2. posts에 누락된 컬럼 추가
        conn.execute(text("""
            ALTER TABLE posts
            ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false
        """))
        conn.execute(text("""
            ALTER TABLE posts
            ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0
        """))
    print("Done: alembic_version=001, posts columns added.")

if __name__ == "__main__":
    main()
