import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  /**
   * Subscribe to UPDATE events on a specific complaint
   */
  subscribeToComplaint(complaintId: string, onUpdate: (payload: any) => void): RealtimeChannel {
    const channelName = `complaint-${complaintId}-${Date.now()}`;
    return this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `id=eq.${complaintId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to INSERT events on complaint_updates for a specific complaint (timeline updates)
   */
  subscribeToComplaintUpdates(complaintId: string, onInsert: (payload: any) => void): RealtimeChannel {
    const channelName = `complaint-updates-${complaintId}-${Date.now()}`;
    return this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaint_updates',
          filter: `complaint_id=eq.${complaintId}`
        },
        (payload) => {
          onInsert(payload);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to all INSERT and UPDATE events on complaints table for the public feed
   */
  subscribeToPublicFeed(onChange: (payload: any) => void): RealtimeChannel {
    const channelName = `public-feed-${Date.now()}`;
    return this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          onChange(payload);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from a realtime channel
   */
  async unsubscribe(channel: RealtimeChannel | null): Promise<void> {
    if (channel) {
      await this.supabase.removeChannel(channel);
    }
  }
}
