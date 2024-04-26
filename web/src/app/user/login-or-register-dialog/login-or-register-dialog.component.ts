import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { LoginFormComponent } from '../login-form/login-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ForgetFormComponent } from '../forget-form/forget-form.component';

@Component({
  selector: 'app-login-or-register-dialog',
  standalone: true,
  imports: [MatTabsModule, RegisterFormComponent, LoginFormComponent, MatIconModule, MatDialogModule, ForgetFormComponent, MatButtonModule],
  templateUrl: './login-or-register-dialog.component.html',
  styleUrl: './login-or-register-dialog.component.sass'
})
export class LoginOrRegisterDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoginOrRegisterDialogComponent>,
  ) { }
  close() {
    this.dialogRef.close();
  }
}
