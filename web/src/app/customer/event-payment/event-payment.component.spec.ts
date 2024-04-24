import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPaymentComponent } from './event-payment.component';

describe('EventPaymentComponent', () => {
  let component: EventPaymentComponent;
  let fixture: ComponentFixture<EventPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
