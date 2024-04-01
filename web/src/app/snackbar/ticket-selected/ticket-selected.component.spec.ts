import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketSelectedComponent } from './ticket-selected.component';

describe('TicketSelectedComponent', () => {
  let component: TicketSelectedComponent;
  let fixture: ComponentFixture<TicketSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketSelectedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
