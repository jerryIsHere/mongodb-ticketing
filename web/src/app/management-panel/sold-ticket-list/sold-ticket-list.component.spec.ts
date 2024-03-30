import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoldTicketListComponent } from './sold-ticket-list.component';

describe('SoldTicketListComponent', () => {
  let component: SoldTicketListComponent;
  let fixture: ComponentFixture<SoldTicketListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoldTicketListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SoldTicketListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
