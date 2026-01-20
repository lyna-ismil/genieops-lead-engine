from sqlmodel import Session, select, create_engine
from app.models.db import AppSetting
from app.core.config import get_settings

# Setup
settings = get_settings()
print(f"Loaded API Key from Env: {settings.llm_api_key[:5]}..." if settings.llm_api_key else "Loaded API Key from Env: None")
# Use localhost because we are running this from WSL (locally) to Windows Postgres
# wait, if running in WSL, the DB URL in .env is 172.19.0.1 which is correct.
engine = create_engine(settings.database_url)

with Session(engine) as session:
    print(f"Checking settings in DB...")
    app_setting = session.exec(select(AppSetting)).first()
    
    if app_setting:
        print(f"Current DB Key: {app_setting.llm_api_key[:5]}..." if app_setting.llm_api_key else "Current DB Key: None")
        if app_setting.llm_api_key != settings.llm_api_key:
            print(f"Updating to match .env: {settings.llm_api_key[:5] if settings.llm_api_key else 'None'}...")
            app_setting.llm_api_key = settings.llm_api_key
            session.add(app_setting)
            session.commit()
            print("Updated successfully.")
        else:
            print("DB Key matches .env. No update needed.")
    else:
        print("No settings found in DB. They will be created on first request.")
