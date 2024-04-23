import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialog, MAT_DIALOG_DATA, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
export interface DialogData {
  reasons: string[];
}

@Component({
  selector: 'app-error-message-dialog',
  standalone: true,
  imports: [MatIconModule, MatDialogModule, MatButtonModule],
  templateUrl: './error-message-dialog.component.html',
  styleUrl: './error-message-dialog.component.sass'
})
export class ErrorMessageDialogComponent {
  errors: string[]
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.errors = []
    this.errors = data.reasons.reduce((errors, error, ind) => {
      if (typeof error == "string" && !errors.includes(error)) {
        errors.push(error)
      }
      return errors
    }, this.errors)
  }
}
