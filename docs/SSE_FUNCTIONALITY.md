# Server-Sent Events (SSE) for Hunt Updates

This document describes the Server-Sent Events functionality for real-time hunt updates.

## Overview

The SSE functionality allows clients to subscribe to real-time updates for specific hunts. When bonuses are added, reordered, or their status changes, all connected clients for that hunt will receive the updated list of bonuses.

## Endpoints

### SSE Connection
- **URL**: `GET /hunts-sse/{huntId}`
- **Description**: Establishes a Server-Sent Events connection for a specific hunt
- **Parameters**: 
  - `huntId` (number): The ID of the hunt to subscribe to

### Health Check
- **URL**: `GET /hunts-sse/{huntId}/health`
- **Description**: Simple health check endpoint for the SSE service
- **Parameters**:
  - `huntId` (number): The ID of the hunt

### Get All Bonuses
- **URL**: `GET /hunts/{huntId}/bonuses`
- **Description**: Get the current list of all bonuses for a hunt (useful for initial state)
- **Parameters**:
  - `huntId` (number): The ID of the hunt

## Event Format

All SSE events follow this format:

```json
{
  "huntId": 123,
  "bonuses": [
    {
      "id": 1,
      "slot": {
        "id": 1,
        "name": "Slot Name",
        "provider": "Provider Name",
        "imageUrl": "https://example.com/image.jpg",
        "url": "https://example.com/slot"
      },
      "value": 100,
      "bet": {
        "amount": 10.5,
        "currency": "USD"
      },
      "notes": "Optional notes"
    }
  ],
  "eventType": "bonuses_updated",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Client Implementation Example

### JavaScript/TypeScript
```javascript
// Connect to SSE endpoint
const eventSource = new EventSource('/hunts-sse/123');

// Listen for messages
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Hunt updated:', data);
  
  // Update your UI with the new bonuses list
  updateBonusesList(data.bonuses);
};

// Handle connection errors
eventSource.onerror = function(error) {
  console.error('SSE connection error:', error);
  // Implement reconnection logic if needed
};

// Close connection when done
// eventSource.close();
```

### cURL Example
```bash
curl -N http://localhost:3000/hunts-sse/123
```

## Triggers

SSE events are emitted when:

1. **Bonus Added**: A new bonus is added to a hunt
2. **Bonus Status Changed**: A bonus status is updated (PENDING → OPENED)
3. **Bonuses Reordered**: The order of bonuses in a hunt is changed

## Notes

- Each SSE connection is specific to a hunt ID
- All events for a hunt include the complete list of bonuses (not just the changed ones)
- The connection will remain open until the client disconnects or the server closes it
- Implement proper error handling and reconnection logic in your client applications
- The SSE endpoint is separate from the main hunts API endpoints for better separation of concerns 