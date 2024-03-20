import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketingFormComponent } from './ticketing-form.component';

describe('TicketingFormComponent', () => {
  let component: TicketingFormComponent;
  let fixture: ComponentFixture<TicketingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketingFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
