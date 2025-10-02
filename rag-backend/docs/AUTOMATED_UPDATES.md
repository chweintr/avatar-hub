# Automated Knowledge Base Updates

The RAG backend includes an automated system to keep the art grants and residencies knowledge base up-to-date.

## How It Works

1. **Scheduled Updates**: The system automatically checks for new grants and residencies based on your configured schedule
2. **Multiple Data Sources**: Scrapes websites, RSS feeds, and APIs from major art residency platforms
3. **Smart Deduplication**: Identifies and merges duplicate entries across sources
4. **Incremental Updates**: Only processes new or changed information
5. **Automatic Re-indexing**: Updates the vector database after each successful update

## Configuration

### Update Schedule

Configure the update frequency using the `UPDATE_SCHEDULE` environment variable:

- **Daily at midnight**: `cron:0 0 * * *`
- **Every 6 hours**: `interval:6h`
- **Weekly on Sundays**: `cron:0 0 * * 0`
- **Every 30 minutes**: `interval:30m`

### Data Sources

The system includes built-in scrapers for:

- **TransArtists**: International artist-in-residence programs
- **ResArtis**: Global network of artist residencies
- **Alliance of Artists Communities**: US-based residencies
- **Res Artist**: European residency database
- **Creative Capital**: Grants and funding opportunities

Add custom sources using the `CUSTOM_DATA_SOURCES` environment variable:

```json
[
  {
    "name": "My Custom Source",
    "url": "https://example.com/residencies",
    "type": "scrape",
    "selectors": {
      "listing": ".residency-item",
      "name": ".title",
      "location": ".location",
      "deadline": ".deadline"
    }
  }
]
```

## API Endpoints

### Manual Update Trigger
```bash
POST /admin/trigger_update
```

Immediately starts a knowledge base update:

```bash
curl -X POST https://your-app.railway.app/admin/trigger_update
```

### Check Update Status
```bash
GET /admin/update_status
```

Returns information about scheduled jobs and next run time:

```bash
curl https://your-app.railway.app/admin/update_status
```

Response:
```json
{
  "scheduler_running": true,
  "jobs": [
    {
      "id": "knowledge_base_update",
      "name": "Knowledge Base Update",
      "next_run_time": "2024-01-16T00:00:00Z",
      "trigger": "cron[0 0 * * *]"
    }
  ],
  "update_schedule": "cron:0 0 * * *"
}
```

## Update Process

1. **Data Collection**: System fetches latest data from all enabled sources
2. **Extraction**: Parses HTML/RSS/JSON to extract grant/residency information
3. **Normalization**: Converts all data to a consistent format
4. **Deduplication**: Compares with existing entries using fuzzy matching
5. **Integration**: Updates or adds new entries to knowledge base
6. **Re-indexing**: Regenerates embeddings for modified content
7. **Notification**: Sends update summary to configured webhook

## Monitoring

### Logs
Monitor update activity in Railway logs:

```
2024-01-15 00:00:01 - Starting scheduled knowledge base update
2024-01-15 00:00:05 - Collected 15 entries from TransArtists
2024-01-15 00:00:08 - Collected 8 entries from ResArtis RSS
2024-01-15 00:00:15 - Update completed. New: 3, Updated: 5, Errors: 0
```

### Notifications
Configure a webhook URL to receive update notifications:

```
NOTIFICATION_WEBHOOK=https://your-slack-webhook.com/notify
```

Notification format:
```json
{
  "text": "Knowledge Base Update Complete",
  "stats": {
    "new": 3,
    "updated": 5,
    "errors": 0
  },
  "duration_seconds": 45.2,
  "timestamp": "2024-01-15T00:00:45Z"
}
```

## Best Practices

1. **Start Conservative**: Begin with weekly updates, increase frequency if needed
2. **Monitor Sources**: Check logs for scraping errors - websites change
3. **Custom Sources**: Add region-specific or niche residency sources
4. **Backup Data**: Regularly export your knowledge base JSON
5. **Test Updates**: Use manual trigger to test after adding new sources

## Troubleshooting

### Updates Not Running
- Check `UPDATE_SCHEDULE` format
- Verify scheduler is running: `GET /admin/update_status`
- Check Railway logs for errors

### Scraping Failures
- Some sites may block automated access
- Add custom selectors for changed website structures
- Consider using API sources when available

### Duplicate Entries
- System uses name + organization for deduplication
- Adjust matching threshold in code if needed
- Manual cleanup via direct JSON editing

## Adding New Sources

To add a new data source:

1. For simple sites, use `CUSTOM_DATA_SOURCES` environment variable
2. For complex sites, add to `data_updater.py`:

```python
DataSource(
    name="New Art Platform",
    url="https://newplatform.com/opportunities",
    type="scrape",
    selectors={
        "listing": ".opportunity",
        "name": ".title",
        "deadline": ".deadline",
        "amount": ".funding"
    }
)
```

The automated update system ensures your art grants expert always has the latest opportunities to share!