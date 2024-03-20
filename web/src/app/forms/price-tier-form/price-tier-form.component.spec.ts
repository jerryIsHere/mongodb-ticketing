import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceTierFormComponent } from './price-tier-form.component';

describe('PriceTierFormComponent', () => {
  let component: PriceTierFormComponent;
  let fixture: ComponentFixture<PriceTierFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceTierFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PriceTierFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
