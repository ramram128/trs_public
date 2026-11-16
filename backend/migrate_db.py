import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, MetaData, text
from app.database import Base
from app.models import *

sqlite_engine = create_engine('sqlite:///trs_imports.db')
mysql_engine = create_engine('mysql+pymysql://root:@127.0.0.1:3306/trs_db')

# Create tables in MySQL if they don't exist
Base.metadata.create_all(bind=mysql_engine)

meta = MetaData()
meta.reflect(bind=sqlite_engine)

with mysql_engine.begin() as mysql_conn:
    mysql_conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
    
    for table_name in meta.tables:
        table = meta.tables[table_name]
        print(f"Migrating table: {table_name}...")
        
        mysql_conn.execute(text(f"TRUNCATE TABLE {table_name};"))
        
        with sqlite_engine.connect() as sqlite_conn:
            rows = sqlite_conn.execute(table.select()).fetchall()
            if rows:
                data = [dict(row._mapping) for row in rows]
                mysql_conn.execute(table.insert(), data)
                print(f"  Inserted {len(rows)} rows.")
            else:
                print("  No rows.")
                
    mysql_conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
    print("Migration completed successfully!")
