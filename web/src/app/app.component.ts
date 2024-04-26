import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { UserSessionService } from './service/user-session.service';
import { ApiService } from './service/api.service';
import { LoginOrRegisterDialogComponent } from './user/login-or-register-dialog/login-or-register-dialog.component';
import { Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatMenuModule, MatButtonModule, RouterModule, MatProgressBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'HK City Choir Ticketing';
  loginOrRegister() {
    const dialogRef = this.dialog.open(LoginOrRegisterDialogComponent, {
      autoFocus: false
    });
  }
  constructor(public userSession: UserSessionService, public api: ApiService, public dialog: MatDialog, public router: Router) {
    if (userSession.user) {

    }
    else {
      this.loginOrRegister()
    }
  }
}
