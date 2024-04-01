import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatSelectedComponent } from './seat-selected.component';

describe('SeatSelectedComponent', () => {
  let component: SeatSelectedComponent;
  let fixture: ComponentFixture<SeatSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatSelectedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeatSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
