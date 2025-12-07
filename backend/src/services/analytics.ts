import { pool } from '../db/connection.js';

export async function trackAnalyticsEvent(
  hotelId: number,
  eventType: string,
  eventData: Record<string, any> = {}
) {
  try {
    await pool.query(
      `INSERT INTO analytics_events (hotel_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [hotelId, eventType, JSON.stringify(eventData)]
    );
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

