# Full-Text Search Functionality

This document describes the full-text search capabilities implemented for the slots using PostgreSQL's tsvector functionality.

## Overview

The search functionality uses PostgreSQL's built-in full-text search features to provide fast, ranked search results similar to Elasticsearch but using only PostgreSQL.

## Setup

### 1. Run the Migration

Execute the SQL migration script to add the search vector column and index:

```bash
psql -d your_database_name -f migrations/add-search-vector.sql
```

### 2. Update Existing Data

If you have existing slot data, run the update endpoint to populate search vectors:

```bash
curl -X POST http://localhost:3000/slots/update-search-vectors
```

## API Endpoints

### Basic Search

Search for slots by name with ranking:

```
GET /slots/search?q=search_term
```

**Example:**
```bash
curl "http://localhost:3000/slots/search?q=dragon"
```

**Response:**
```json
[
  {
    "id": 123,
    "name": "Dragon's Fortune",
    "provider": "Pragmatic Play",
    "imageUrl": "https://example.com/image.jpg",
    "url": "https://gamdom.com/casino/dragons-fortune",
    "releaseDate": "2024-01-15T00:00:00.000Z",
    "rank": 0.123456
  }
]
```

### Filtered Search

Search with additional filters:

```
GET /slots/search/filtered?q=search_term&providers=provider1,provider2&limit=20
```

**Parameters:**
- `q` (required): Search query
- `providers` (optional): Comma-separated list of providers to filter by
- `limit` (optional): Maximum number of results (default: 50)

**Example:**
```bash
curl "http://localhost:3000/slots/search/filtered?q=fortune&providers=Pragmatic%20Play,Nolimit%20City&limit=10"
```

## How It Works

### PostgreSQL tsvector

The search uses PostgreSQL's `tsvector` type which:
- Tokenizes text into searchable terms
- Removes stop words (common words like "the", "and", etc.)
- Normalizes terms for better matching
- Supports ranking algorithms

### Ranking

Results are ranked using `ts_rank()` which considers:
- Term frequency in the document
- Term frequency in the corpus
- Document length
- Term proximity

### Performance

- GIN index on the `search_vector` column provides fast full-text search
- Automatic trigger updates search vectors when slot names change
- Results are limited to prevent performance issues

## Search Features

### Text Normalization
- Case-insensitive search
- Automatic stemming (e.g., "dragons" matches "dragon")
- Stop word removal
- Punctuation handling

### Ranking Algorithm
- Uses PostgreSQL's default ranking algorithm
- Higher scores for more relevant matches
- Considers term frequency and document length

### Filtering
- Filter by multiple providers
- Configurable result limits
- Ordered by relevance then release date

## Maintenance

### Updating Search Vectors

If you need to update search vectors for all slots:

```bash
curl -X POST http://localhost:3000/slots/update-search-vectors
```

### Automatic Updates

The database trigger automatically updates search vectors when:
- New slots are inserted
- Existing slot names are updated

## Performance Considerations

- GIN index provides O(log n) search performance
- Search vectors are automatically maintained
- Results are limited to prevent memory issues
- Consider adding additional indexes for provider filtering if needed

## Troubleshooting

### Search Not Working
1. Ensure the migration has been run
2. Check that search vectors are populated
3. Verify the GIN index exists

### Poor Performance
1. Check if the GIN index is being used (EXPLAIN ANALYZE)
2. Consider reducing the result limit
3. Add additional indexes for filtering if needed

### Empty Results
1. Verify the search term is not too restrictive
2. Check if the slot names contain the search terms
3. Try different search terms to test the functionality 