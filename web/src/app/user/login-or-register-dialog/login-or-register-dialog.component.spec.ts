import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginOrRegisterDialogComponent } from './login-or-register-dialog.component';

describe('LoginOrRegisterDialogComponent', () => {
  let component: LoginOrRegisterDialogComponent;
  let fixture: ComponentFixture<LoginOrRegisterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginOrRegisterDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginOrRegisterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
