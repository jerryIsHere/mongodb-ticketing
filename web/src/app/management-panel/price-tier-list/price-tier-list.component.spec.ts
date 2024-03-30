import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceTierListComponent } from './price-tier-list.component';

describe('PriceTierListComponent', () => {
  let component: PriceTierListComponent;
  let fixture: ComponentFixture<PriceTierListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceTierListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PriceTierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
