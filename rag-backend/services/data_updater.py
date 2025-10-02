"""
Automated data update service for art grants and residencies knowledge base
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set
import hashlib
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
import feedparser
from pydantic import BaseModel, Field

from ..utils.config import settings
from .vector_store import VectorStoreService

# Configure logging
logger = logging.getLogger(__name__)

class GrantResidencyEntry(BaseModel):
    """Schema for grant/residency entries"""
    id: str
    type: str  # 'grant' or 'residency'
    name: str
    organization: Optional[str] = None
    location: Optional[str] = None
    description: str
    disciplines: List[str] = Field(default_factory=list)
    duration: Optional[str] = None
    amount: Optional[str] = None
    benefits: List[str] = Field(default_factory=list)
    eligibility: Optional[str] = None
    application_tips: Optional[str] = None
    deadlines: List[str] = Field(default_factory=list)
    website: Optional[str] = None
    source_url: str
    last_updated: str
    hash: Optional[str] = None

class DataSource(BaseModel):
    """Configuration for a data source"""
    name: str
    url: str
    type: str  # 'scrape', 'api', 'rss'
    selectors: Optional[Dict[str, str]] = None  # CSS selectors for scraping
    api_key: Optional[str] = None
    enabled: bool = True

class DataUpdaterService:
    def __init__(self):
        self.vector_store = VectorStoreService()
        self.data_sources = self._load_data_sources()
        self.kb_path = Path(settings.KNOWLEDGE_BASE_PATH)
        self.existing_entries: Dict[str, GrantResidencyEntry] = {}
        
    def _load_data_sources(self) -> List[DataSource]:
        """Load data sources from configuration"""
        sources = []
        
        # Art residency aggregator sites
        sources.extend([
            DataSource(
                name="TransArtists",
                url="https://www.transartists.org/air",
                type="scrape",
                selectors={
                    "listing": ".air-listing",
                    "name": ".air-title",
                    "location": ".air-location",
                    "deadline": ".air-deadline",
                    "description": ".air-description"
                }
            ),
            DataSource(
                name="ResArtis RSS",
                url="https://resartis.org/feed/",
                type="rss"
            ),
            DataSource(
                name="Alliance of Artists Communities",
                url="https://www.artistcommunities.org/residencies",
                type="scrape",
                selectors={
                    "listing": ".residency-item",
                    "name": ".residency-name",
                    "location": ".residency-location",
                    "disciplines": ".residency-disciplines"
                }
            ),
            DataSource(
                name="Res Artist",
                url="https://resartist.com/en/residencies/",
                type="scrape",
                selectors={
                    "listing": ".residency-card",
                    "name": ".card-title",
                    "location": ".card-location",
                    "deadline": ".card-deadline"
                }
            ),
            DataSource(
                name="Creative Capital",
                url="https://creative-capital.org/grants/",
                type="scrape",
                selectors={
                    "listing": ".grant-item",
                    "name": ".grant-title",
                    "amount": ".grant-amount",
                    "deadline": ".grant-deadline"
                }
            )
        ])
        
        # Add custom sources from environment
        custom_sources_json = settings.CUSTOM_DATA_SOURCES
        if custom_sources_json:
            try:
                custom_sources = json.loads(custom_sources_json)
                for source in custom_sources:
                    sources.append(DataSource(**source))
            except Exception as e:
                logger.error(f"Error loading custom data sources: {e}")
        
        return sources
    
    async def update_knowledge_base(self) -> Dict[str, int]:
        """Main update process"""
        logger.info("Starting knowledge base update")
        stats = {"new": 0, "updated": 0, "errors": 0}
        
        try:
            # Load existing entries
            await self._load_existing_entries()
            
            # Collect data from all sources
            all_entries = []
            for source in self.data_sources:
                if not source.enabled:
                    continue
                    
                try:
                    entries = await self._collect_from_source(source)
                    all_entries.extend(entries)
                    logger.info(f"Collected {len(entries)} entries from {source.name}")
                except Exception as e:
                    logger.error(f"Error collecting from {source.name}: {e}")
                    stats["errors"] += 1
            
            # Process and integrate entries
            for entry in all_entries:
                try:
                    is_new = await self._integrate_entry(entry)
                    if is_new:
                        stats["new"] += 1
                    else:
                        stats["updated"] += 1
                except Exception as e:
                    logger.error(f"Error integrating entry {entry.name}: {e}")
                    stats["errors"] += 1
            
            # Save updated knowledge base
            await self._save_knowledge_base()
            
            # Re-ingest into vector store
            await self._reingest_vector_store()
            
            logger.info(f"Update completed. New: {stats['new']}, Updated: {stats['updated']}, Errors: {stats['errors']}")
            
        except Exception as e:
            logger.error(f"Fatal error during update: {e}")
            stats["errors"] += 1
        
        return stats
    
    async def _load_existing_entries(self):
        """Load existing entries from knowledge base"""
        if self.kb_path.exists():
            with open(self.kb_path, 'r') as f:
                data = json.load(f)
                for entry_data in data.get("knowledge_base", {}).get("entries", []):
                    entry = GrantResidencyEntry(**entry_data)
                    self.existing_entries[entry.id] = entry
    
    async def _collect_from_source(self, source: DataSource) -> List[GrantResidencyEntry]:
        """Collect entries from a single source"""
        if source.type == "scrape":
            return await self._scrape_website(source)
        elif source.type == "rss":
            return await self._parse_rss_feed(source)
        elif source.type == "api":
            return await self._fetch_from_api(source)
        else:
            raise ValueError(f"Unknown source type: {source.type}")
    
    async def _scrape_website(self, source: DataSource) -> List[GrantResidencyEntry]:
        """Scrape a website for grant/residency listings"""
        entries = []
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(source.url, timeout=30.0)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Find all listings
                listings = soup.select(source.selectors.get("listing", ".listing"))
                
                for listing in listings:
                    try:
                        entry = self._extract_entry_from_html(listing, source)
                        if entry:
                            entries.append(entry)
                    except Exception as e:
                        logger.debug(f"Error extracting entry from {source.name}: {e}")
                        
            except Exception as e:
                logger.error(f"Error scraping {source.url}: {e}")
        
        return entries
    
    def _extract_entry_from_html(self, element, source: DataSource) -> Optional[GrantResidencyEntry]:
        """Extract entry data from HTML element"""
        selectors = source.selectors or {}
        
        # Extract basic fields
        name = self._safe_extract_text(element, selectors.get("name"))
        if not name:
            return None
            
        location = self._safe_extract_text(element, selectors.get("location"))
        description = self._safe_extract_text(element, selectors.get("description"))
        deadline = self._safe_extract_text(element, selectors.get("deadline"))
        
        # Generate unique ID
        entry_id = self._generate_id(name, source.name)
        
        # Determine type based on keywords
        entry_type = "grant" if any(word in name.lower() for word in ["grant", "award", "fund"]) else "residency"
        
        entry = GrantResidencyEntry(
            id=entry_id,
            type=entry_type,
            name=name,
            location=location,
            description=description or f"Opportunity from {source.name}",
            deadlines=[deadline] if deadline else [],
            source_url=source.url,
            last_updated=datetime.now().isoformat(),
            website=self._safe_extract_href(element, selectors.get("link"))
        )
        
        # Extract additional fields if available
        if "amount" in selectors:
            entry.amount = self._safe_extract_text(element, selectors["amount"])
        
        if "disciplines" in selectors:
            disciplines_text = self._safe_extract_text(element, selectors["disciplines"])
            if disciplines_text:
                entry.disciplines = [d.strip() for d in disciplines_text.split(",")]
        
        # Generate hash for change detection
        entry.hash = self._generate_entry_hash(entry)
        
        return entry
    
    async def _parse_rss_feed(self, source: DataSource) -> List[GrantResidencyEntry]:
        """Parse RSS feed for opportunities"""
        entries = []
        
        try:
            feed = feedparser.parse(source.url)
            
            for item in feed.entries:
                # Extract data from RSS item
                name = item.get('title', '')
                description = item.get('summary', item.get('description', ''))
                link = item.get('link', '')
                published = item.get('published_parsed')
                
                if not name:
                    continue
                
                # Generate entry
                entry_id = self._generate_id(name, source.name)
                entry_type = "grant" if any(word in name.lower() for word in ["grant", "award", "fund"]) else "residency"
                
                entry = GrantResidencyEntry(
                    id=entry_id,
                    type=entry_type,
                    name=name,
                    description=description[:500] + "..." if len(description) > 500 else description,
                    source_url=source.url,
                    website=link,
                    last_updated=datetime.now().isoformat()
                )
                
                entry.hash = self._generate_entry_hash(entry)
                entries.append(entry)
                
        except Exception as e:
            logger.error(f"Error parsing RSS feed {source.url}: {e}")
        
        return entries
    
    async def _fetch_from_api(self, source: DataSource) -> List[GrantResidencyEntry]:
        """Fetch data from API endpoint"""
        entries = []
        
        async with httpx.AsyncClient() as client:
            headers = {}
            if source.api_key:
                headers["Authorization"] = f"Bearer {source.api_key}"
            
            try:
                response = await client.get(source.url, headers=headers, timeout=30.0)
                response.raise_for_status()
                
                data = response.json()
                
                # This would need to be customized based on the API structure
                # Example implementation for a hypothetical API
                for item in data.get("results", []):
                    entry = GrantResidencyEntry(
                        id=self._generate_id(item.get("name"), source.name),
                        type=item.get("type", "residency"),
                        name=item.get("name"),
                        description=item.get("description", ""),
                        location=item.get("location"),
                        deadlines=item.get("deadlines", []),
                        source_url=source.url,
                        website=item.get("website"),
                        last_updated=datetime.now().isoformat()
                    )
                    
                    entry.hash = self._generate_entry_hash(entry)
                    entries.append(entry)
                    
            except Exception as e:
                logger.error(f"Error fetching from API {source.url}: {e}")
        
        return entries
    
    async def _integrate_entry(self, entry: GrantResidencyEntry) -> bool:
        """Integrate entry into existing knowledge base"""
        existing = self.existing_entries.get(entry.id)
        
        if not existing:
            # New entry
            self.existing_entries[entry.id] = entry
            logger.info(f"Added new entry: {entry.name}")
            return True
        
        elif existing.hash != entry.hash:
            # Updated entry
            self.existing_entries[entry.id] = entry
            logger.info(f"Updated entry: {entry.name}")
            return False
        
        # No change
        return False
    
    async def _save_knowledge_base(self):
        """Save updated knowledge base to file"""
        # Convert entries to dict format
        entries_data = []
        for entry in self.existing_entries.values():
            entry_dict = entry.dict(exclude_none=True)
            entries_data.append(entry_dict)
        
        # Sort by type and name for consistency
        entries_data.sort(key=lambda x: (x["type"], x["name"]))
        
        # Create knowledge base structure
        kb_data = {
            "knowledge_base": {
                "metadata": {
                    "version": "1.0",
                    "last_updated": datetime.now().isoformat(),
                    "description": "Art grants and residencies expert knowledge base",
                    "total_entries": len(entries_data)
                },
                "entries": entries_data
            }
        }
        
        # Save to file
        with open(self.kb_path, 'w') as f:
            json.dump(kb_data, f, indent=2)
        
        logger.info(f"Saved {len(entries_data)} entries to knowledge base")
    
    async def _reingest_vector_store(self):
        """Trigger re-ingestion of updated data into vector store"""
        try:
            await self.vector_store.ingest_data()
            logger.info("Successfully re-ingested data into vector store")
        except Exception as e:
            logger.error(f"Error re-ingesting data: {e}")
            raise
    
    # Utility methods
    def _safe_extract_text(self, element, selector: Optional[str]) -> Optional[str]:
        """Safely extract text from element"""
        if not selector:
            return None
        try:
            found = element.select_one(selector)
            return found.get_text(strip=True) if found else None
        except:
            return None
    
    def _safe_extract_href(self, element, selector: Optional[str]) -> Optional[str]:
        """Safely extract href from element"""
        if not selector:
            return None
        try:
            found = element.select_one(selector)
            return found.get('href') if found else None
        except:
            return None
    
    def _generate_id(self, name: str, source: str) -> str:
        """Generate unique ID for entry"""
        combined = f"{name.lower()}_{source.lower()}"
        return hashlib.md5(combined.encode()).hexdigest()[:12]
    
    def _generate_entry_hash(self, entry: GrantResidencyEntry) -> str:
        """Generate hash of entry content for change detection"""
        content = f"{entry.name}{entry.description}{entry.location}{entry.deadlines}"
        return hashlib.md5(content.encode()).hexdigest()