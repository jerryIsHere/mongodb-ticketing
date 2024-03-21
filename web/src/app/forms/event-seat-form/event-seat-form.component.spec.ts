import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSeatFormComponent } from './event-seat-form.component';

describe('EventSeatFormComponent', () => {
  let component: EventSeatFormComponent;
  let fixture: ComponentFixture<EventSeatFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSeatFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventSeatFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
