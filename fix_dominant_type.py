#!/usr/bin/env python3
# fix_dominant_type.py - Исправляем столбец dominant_type

import os
import psycopg2
from urllib.parse import urlparse

def main():
    try:
        db_url = os.getenv('SQLALCHEMY_DATABASE_URI', 'postgresql://postgres:secret@176.109.110.217:1112/postgres')
        parsed = urlparse(db_url)
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]
        )
        
        conn.autocommit = True
        cur = conn.cursor()
        
        print("🔧 Fixing dominant_type column...")
        
        # Проверяем существование столбца dominant_type
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_candidates' AND column_name = 'dominant_type'
        """)
        
        exists = cur.fetchone()[0] > 0
        
        if not exists:
            print("   📋 Adding dominant_type column...")
            cur.execute("ALTER TABLE assessment_candidates ADD COLUMN dominant_type VARCHAR(20)")
            print("   ✅ Added dominant_type column")
        else:
            print("   ℹ️ dominant_type column already exists")
        
        # Проверим все столбцы в таблице
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_candidates'
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        print("\n📋 Столбцы в assessment_candidates:")
        for col_name, col_type in columns:
            print(f"   - {col_name}: {col_type}")
        
        # Проверим что в questionnaires есть данные
        cur.execute("SELECT id, title, questions_count FROM questionnaires")
        questionnaires = cur.fetchall()
        
        print(f"\n📋 Опросники ({len(questionnaires)}):")
        for q_id, title, count in questionnaires:
            print(f"   - ID {q_id}: {title} ({count} вопросов)")
        
        conn.close()
        print("\n✅ Database check completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()