import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventseatComponent } from './eventseat.component';

describe('EventseatComponent', () => {
  let component: EventseatComponent;
  let fixture: ComponentFixture<EventseatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventseatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventseatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
