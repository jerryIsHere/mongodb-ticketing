import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../service/api.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { AdminTicketAPIObject, WithId } from '../../interface-util'

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatRadioModule, MatCardModule, MatIconModule, MatDialogModule],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.sass'
})
export class TicketFormComponent {
  ticketForm: FormGroup = this._formBuilder.group({
    confirmedBy: new FormControl(
      this.ticket && this.ticket.paymentInfo?.confirmedBy ? this.ticket.paymentInfo.confirmedBy : ""),
    remark: new FormControl(
      this.ticket && this.ticket.paymentInfo?.remark ? this.ticket.paymentInfo.remark : ""),
  });
  constructor(
    public dialogRef: MatDialogRef<TicketFormComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: (AdminTicketAPIObject & WithId),
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.ticketForm.valid) {
      this.api.request.patch(`/ticket/${this.ticket._id}?verify`, this.ticketForm.getRawValue()).toPromise().then((result: any) => {
        if (result && result.success) {
          this.dialogRef.close({ ...this.ticket, ...this.ticketForm.getRawValue() })
        }
      })
    }
  }
  voidTicket() {
    this.api.request.patch(`/ticket/${this.ticket._id}?void`, {}).toPromise().then((result: any) => {
      if (result && result.success) {
        this.dialogRef.close({ ...this.ticket, ...this.ticketForm.getRawValue(), voided: true })
      }
    })
  }
  close() {
    this.dialogRef.close();
  }
}
