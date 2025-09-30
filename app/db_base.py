from sqlalchemy.orm import declarative_base

# Central Base without creating engines on import
Base = declarative_base()
