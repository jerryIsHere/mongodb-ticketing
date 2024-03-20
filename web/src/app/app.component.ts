import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { UserSessionService } from './service/user-session.service';
import { ApiService } from './service/api.service';
import { LoginOrRegisterDialogComponent } from './user/login-or-register-dialog/login-or-register-dialog.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatMenuModule, MatButtonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'HK City Choir Ticketing';
  loginOrRegister() {
    const dialogRef = this.dialog.open(LoginOrRegisterDialogComponent,);
  }
  constructor(public userSession: UserSessionService, public api: ApiService, public dialog: MatDialog) {

  }
}
