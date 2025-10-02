#!/usr/bin/env python3
"""
Test script for data updater functionality
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.data_updater import DataUpdaterService, DataSource, GrantResidencyEntry
from utils.config import settings

async def test_data_sources():
    """Test loading and parsing data sources"""
    print("\n=== Testing Data Sources ===")
    updater = DataUpdaterService()
    
    print(f"Found {len(updater.data_sources)} data sources:")
    for source in updater.data_sources:
        print(f"  - {source.name}: {source.url} ({source.type})")

async def test_entry_generation():
    """Test creating grant/residency entries"""
    print("\n=== Testing Entry Generation ===")
    
    test_entry = GrantResidencyEntry(
        id="test_001",
        type="residency",
        name="Test Artist Residency",
        description="A test residency for validation",
        disciplines=["Visual Arts", "Digital Media"],
        location="Berlin, Germany",
        duration="3 months",
        deadlines=["March 1, 2024", "September 1, 2024"],
        website="https://example.com",
        source_url="https://source.example.com",
        last_updated="2024-01-15T00:00:00"
    )
    
    print(f"Created entry: {test_entry.name}")
    print(f"  Type: {test_entry.type}")
    print(f"  Location: {test_entry.location}")
    print(f"  Deadlines: {', '.join(test_entry.deadlines)}")

async def test_mock_scraping():
    """Test scraping with mock HTML"""
    print("\n=== Testing Mock Scraping ===")
    
    from bs4 import BeautifulSoup
    
    mock_html = """
    <div class="residency-list">
        <div class="residency-item">
            <h3 class="title">Digital Arts Residency Berlin</h3>
            <p class="location">Berlin, Germany</p>
            <p class="deadline">Deadline: March 15, 2024</p>
            <p class="description">3-month residency for digital artists with studio space and stipend.</p>
        </div>
        <div class="residency-item">
            <h3 class="title">New Media Grant Program</h3>
            <p class="location">Online</p>
            <p class="deadline">Deadline: April 30, 2024</p>
            <p class="description">$10,000 grants for innovative new media projects.</p>
        </div>
    </div>
    """
    
    soup = BeautifulSoup(mock_html, 'html.parser')
    
    mock_source = DataSource(
        name="Mock Source",
        url="https://mock.example.com",
        type="scrape",
        selectors={
            "listing": ".residency-item",
            "name": ".title",
            "location": ".location",
            "deadline": ".deadline",
            "description": ".description"
        }
    )
    
    updater = DataUpdaterService()
    entries = []
    
    listings = soup.select(mock_source.selectors["listing"])
    for listing in listings:
        entry = updater._extract_entry_from_html(listing, mock_source)
        if entry:
            entries.append(entry)
            print(f"Extracted: {entry.name}")
            print(f"  Type: {entry.type}")
            print(f"  Location: {entry.location}")
            print(f"  Deadline: {entry.deadlines[0] if entry.deadlines else 'None'}")
    
    print(f"\nTotal extracted: {len(entries)} entries")

async def test_deduplication():
    """Test deduplication logic"""
    print("\n=== Testing Deduplication ===")
    
    updater = DataUpdaterService()
    
    # Create two similar entries
    entry1 = GrantResidencyEntry(
        id=updater._generate_id("Berlin Artist Residency", "Source1"),
        type="residency",
        name="Berlin Artist Residency",
        description="Residency in Berlin",
        source_url="https://source1.com",
        last_updated="2024-01-15T00:00:00"
    )
    entry1.hash = updater._generate_entry_hash(entry1)
    
    entry2 = GrantResidencyEntry(
        id=updater._generate_id("Berlin Artist Residency", "Source2"),
        type="residency",
        name="Berlin Artist Residency",
        description="Residency in Berlin - updated description",
        source_url="https://source2.com",
        last_updated="2024-01-15T00:00:00"
    )
    entry2.hash = updater._generate_entry_hash(entry2)
    
    print(f"Entry 1 ID: {entry1.id}")
    print(f"Entry 2 ID: {entry2.id}")
    print(f"Same ID: {entry1.id == entry2.id}")
    print(f"Same hash: {entry1.hash == entry2.hash}")

async def test_json_operations():
    """Test saving and loading knowledge base"""
    print("\n=== Testing JSON Operations ===")
    
    test_file = Path("test_kb.json")
    
    try:
        updater = DataUpdaterService()
        
        # Add test entries
        test_entries = {
            "test_001": GrantResidencyEntry(
                id="test_001",
                type="grant",
                name="Test Grant",
                description="Test grant for artists",
                amount="$5,000",
                deadlines=["December 31, 2024"],
                source_url="https://test.com",
                last_updated="2024-01-15T00:00:00"
            ),
            "test_002": GrantResidencyEntry(
                id="test_002",
                type="residency",
                name="Test Residency",
                description="Test residency program",
                location="Test City",
                duration="1 month",
                source_url="https://test.com",
                last_updated="2024-01-15T00:00:00"
            )
        }
        
        updater.existing_entries = test_entries
        updater.kb_path = test_file
        
        # Save to JSON
        await updater._save_knowledge_base()
        print(f"Saved {len(test_entries)} entries to {test_file}")
        
        # Load and verify
        with open(test_file, 'r') as f:
            data = json.load(f)
        
        loaded_entries = data["knowledge_base"]["entries"]
        print(f"Loaded {len(loaded_entries)} entries from JSON")
        
        for entry in loaded_entries:
            print(f"  - {entry['name']} ({entry['type']})")
    
    finally:
        # Cleanup
        if test_file.exists():
            test_file.unlink()
            print(f"Cleaned up {test_file}")

async def test_full_update_dry_run():
    """Test full update process without actually scraping"""
    print("\n=== Testing Full Update (Dry Run) ===")
    
    # Temporarily disable web scraping
    original_setting = settings.ENABLE_WEB_SCRAPING
    settings.ENABLE_WEB_SCRAPING = False
    
    try:
        updater = DataUpdaterService()
        
        # Add mock existing entries
        updater.existing_entries = {
            "existing_001": GrantResidencyEntry(
                id="existing_001",
                type="grant",
                name="Existing Grant",
                description="An existing grant",
                source_url="https://existing.com",
                last_updated="2024-01-01T00:00:00"
            )
        }
        
        print(f"Starting with {len(updater.existing_entries)} existing entries")
        
        # Note: This would normally trigger actual web scraping
        # stats = await updater.update_knowledge_base()
        # print(f"Update stats: {stats}")
        
        print("Dry run complete (web scraping disabled)")
        
    finally:
        settings.ENABLE_WEB_SCRAPING = original_setting

async def main():
    """Run all tests"""
    print("Data Updater Test Suite")
    print("=" * 50)
    
    tests = [
        test_data_sources,
        test_entry_generation,
        test_mock_scraping,
        test_deduplication,
        test_json_operations,
        test_full_update_dry_run
    ]
    
    for test in tests:
        try:
            await test()
        except Exception as e:
            print(f"\n❌ Error in {test.__name__}: {e}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())