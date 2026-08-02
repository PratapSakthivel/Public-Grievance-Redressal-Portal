import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WsMessage {
  event: string;
  complaintId?: number;
  title?: string;
  status?: string;
  upvotes?: number;
  officer?: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<WsMessage>();
  messages$ = this.messageSubject.asObservable();

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(environment.wsUrl);
    this.ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        this.messageSubject.next(data);
      } catch (e) { /* ignore malformed messages */ }
    };
    this.ws.onerror = () => this.reconnect();
    this.ws.onclose = () => this.reconnect();
  }

  private reconnect(): void {
    setTimeout(() => this.connect(), 3000);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
