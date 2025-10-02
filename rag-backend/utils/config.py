"""
Configuration management using pydantic-settings
Reads from environment variables with validation
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key for GPT-4o and embeddings")
    SIMLI_API_KEY: Optional[str] = Field(None, description="Simli API key")
    SIMLI_FACE_ID: Optional[str] = Field(None, description="Simli Face ID for avatar")
    SIMLI_AGENT_ID: Optional[str] = Field(None, description="Simli Agent ID for knowledge base")
    ELEVENLABS_API_KEY: Optional[str] = Field(None, description="ElevenLabs API key for TTS")
    
    # Vector Database Configuration
    VECTOR_DB_TYPE: str = Field("chroma", description="Vector database type: chroma, pinecone, or weaviate")
    VECTOR_DB_API_KEY: Optional[str] = Field(None, description="API key for cloud vector databases")
    VECTOR_DB_URL: Optional[str] = Field(None, description="URL for cloud vector databases")
    CHROMA_PERSIST_DIR: str = Field("./chroma_db", description="Directory for ChromaDB persistence")
    
    # Model Configuration
    EMBEDDING_MODEL: str = Field("text-embedding-ada-002", description="OpenAI embedding model")
    LLM_MODEL: str = Field("gpt-4o", description="OpenAI LLM model")
    MAX_TOKENS: int = Field(2000, description="Maximum tokens for LLM response")
    TEMPERATURE: float = Field(0.7, description="Temperature for LLM generation")
    
    # RAG Configuration
    CHUNK_SIZE: int = Field(1000, description="Size of text chunks for processing")
    CHUNK_OVERLAP: int = Field(200, description="Overlap between chunks")
    NUM_RESULTS: int = Field(5, description="Default number of results to retrieve")
    RELEVANCE_THRESHOLD: float = Field(0.7, description="Minimum relevance score for results")
    
    # Application Configuration
    APP_NAME: str = Field("Art Grants & Residency Expert", description="Application name")
    DEBUG: bool = Field(False, description="Debug mode")
    CORS_ORIGINS: List[str] = Field(["*"], description="CORS allowed origins")
    PORT: int = Field(8000, description="Application port")
    
    # Railway Configuration
    RAILWAY_PUBLIC_DOMAIN: Optional[str] = Field(None, description="Railway public domain")
    
    # Knowledge Base Configuration
    KNOWLEDGE_BASE_PATH: str = Field("./data/art_grants_residencies_kb.json", description="Path to knowledge base JSON")
    
    # Update Schedule Configuration
    UPDATE_SCHEDULE: str = Field("cron:0 0 * * *", description="Update schedule (cron or interval format)")
    UPDATE_ON_STARTUP: bool = Field(False, description="Run update on startup")
    
    # Data Source Configuration
    CUSTOM_DATA_SOURCES: Optional[str] = Field(None, description="JSON string of custom data sources")
    ENABLE_WEB_SCRAPING: bool = Field(True, description="Enable web scraping sources")
    SCRAPING_TIMEOUT: int = Field(30, description="Timeout for web scraping in seconds")
    
    # Notification Configuration
    NOTIFICATION_WEBHOOK: Optional[str] = Field(None, description="Webhook URL for update notifications")
    
    # Expert Persona
    SYSTEM_PROMPT: str = Field(
        """You are an expert art grant and residency advisor for artists. Your expertise includes:

1. Comprehensive knowledge of international art grants, fellowships, and residency programs
2. Understanding of application requirements, deadlines, and eligibility criteria
3. Ability to match artists with appropriate opportunities based on their medium, career stage, and goals
4. Practical advice on creating compelling applications and portfolios
5. Knowledge of funding amounts, benefits, and what each program offers

Your responses should be:
- Accurate and based on the provided context
- Helpful and actionable
- Encouraging and supportive of artists' goals
- Clear about any limitations in your knowledge

If the context doesn't contain specific information, acknowledge this honestly and provide general guidance where appropriate.""",
        description="System prompt for the LLM"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Validate critical settings at import time
def validate_settings():
    """Validate that critical settings are configured"""
    errors = []
    
    if not settings.OPENAI_API_KEY:
        errors.append("OPENAI_API_KEY is required")
    
    if settings.VECTOR_DB_TYPE in ["pinecone", "weaviate"] and not settings.VECTOR_DB_API_KEY:
        errors.append(f"{settings.VECTOR_DB_TYPE.upper()}_API_KEY is required for {settings.VECTOR_DB_TYPE}")
    
    if errors:
        raise ValueError(f"Configuration errors: {'; '.join(errors)}")

# Run validation
try:
    validate_settings()
except ValueError as e:
    import logging
    logging.warning(f"Configuration warning: {e}")