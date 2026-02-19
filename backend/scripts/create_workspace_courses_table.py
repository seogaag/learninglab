"""workspace_courses 테이블 생성 스크립트"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import engine

def create_table():
    """workspace_courses 테이블 생성"""
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS workspace_courses (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    description TEXT,
                    section VARCHAR,
                    image_url VARCHAR,
                    alternate_link VARCHAR,
                    course_state VARCHAR DEFAULT 'ACTIVE',
                    organization VARCHAR,
                    "order" INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_workspace_courses_id 
                ON workspace_courses (id)
            """))
            conn.commit()
            print("workspace_courses table created successfully.")
            return True
        except Exception as e:
            print(f"Error occurred: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    create_table()
