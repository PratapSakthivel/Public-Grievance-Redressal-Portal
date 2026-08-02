import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';

describe('AppComponent', () => {
  let authServiceMock: any;
  let wsServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser$: of(null),
      logout: vi.fn(),
    };
    wsServiceMock = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      messages$: of({}),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: WebSocketService, useValue: wsServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render brand text', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-text')?.textContent).toContain('GrievancePortal');
  });
});
