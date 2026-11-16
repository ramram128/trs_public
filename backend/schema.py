import sqlite3
conn = sqlite3.connect('trs_imports.db')
cur = conn.cursor()
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='categories'")
print(cur.fetchone()[0])
conn.close()
