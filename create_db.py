from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:123456@localhost:5432/postgres', isolation_level='AUTOCOMMIT')
try:
    with engine.connect() as conn:
        conn.execute(text('CREATE DATABASE glowsense_db'))
    print("Database 'glowsense_db' created successfully.")
except Exception as e:
    print(f"Error creating database: {e}")
