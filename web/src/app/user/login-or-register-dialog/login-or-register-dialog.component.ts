import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { LoginFormComponent } from '../login-form/login-form.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login-or-register-dialog',
  standalone: true,
  imports: [MatTabsModule, RegisterFormComponent, LoginFormComponent],
  templateUrl: './login-or-register-dialog.component.html',
  styleUrl: './login-or-register-dialog.component.sass'
})
export class LoginOrRegisterDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoginOrRegisterDialogComponent>,
  ) { }
}
