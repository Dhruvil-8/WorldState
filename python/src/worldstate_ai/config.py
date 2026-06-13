"""Configuration for WorldState AI services."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    ai_env: str = "development"
    ai_port: int = 8000

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Go Backend
    backend_url: str = "http://localhost:8080"

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "worldstate"
    postgres_user: str = "worldstate"
    postgres_password: str = "changeme_postgres_password"

    # NATS
    nats_host: str = "localhost"
    nats_port: int = 4222

    # Meilisearch
    meili_host: str = "localhost"
    meili_port: int = 7700
    meili_master_key: str = "changeme_meili_master_key"

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def nats_url(self) -> str:
        return f"nats://{self.nats_host}:{self.nats_port}"

    @property
    def meili_url(self) -> str:
        return f"http://{self.meili_host}:{self.meili_port}"

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
