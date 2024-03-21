import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueSeatComponent } from './venue-seat.component';

describe('VenueSeatComponent', () => {
  let component: VenueSeatComponent;
  let fixture: ComponentFixture<VenueSeatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueSeatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VenueSeatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
