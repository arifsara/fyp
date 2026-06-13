from sqlalchemy import inspect, MetaData
from database import engine
from models import Base
import models # Ensure all models are imported so they register with Base.metadata

def check_missing_columns():
    inspector = inspect(engine)
    db_tables = inspector.get_table_names()
    
    missing_dict = {}
    for table_name in Base.metadata.tables.keys():
        if table_name not in db_tables:
            print(f"Table missing: {table_name}")
            continue
            
        model_columns = Base.metadata.tables[table_name].columns.keys()
        db_columns = [col['name'] for col in inspector.get_columns(table_name)]
        
        missing = [col for col in model_columns if col not in db_columns]
        if missing:
            print(f"Table '{table_name}' is missing columns: {missing}")
            missing_dict[table_name] = missing
            
    return missing_dict

if __name__ == "__main__":
    check_missing_columns()
