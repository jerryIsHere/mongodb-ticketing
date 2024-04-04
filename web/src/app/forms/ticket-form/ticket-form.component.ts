import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../service/api.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { Ticket } from '../../interface'

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, MatIconModule, MatDialogModule],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.sass'
})
export class TicketFormComponent {
  ticketForm: FormGroup = this._formBuilder.group({
    paid: new FormControl(this.ticket.paid),
    paymentRemark: new FormControl(this.ticket.paymentRemark, [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<TicketFormComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket,
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.ticketForm.valid) {
      this.ticket.paid = this.ticketForm.controls["paid"].value;
      this.ticket.paymentRemark = this.ticketForm.controls["paymentRemark"].value;
      this.api.request.patch(`/ticket/${this.ticket._id}?payment`, { ...this.ticket }).toPromise().then((result: any) => {
        if (result && result.success) {
          this.dialogRef.close(this.ticket)
        }
      })
    }
  }
  voidTicket() {
    this.api.request.patch(`/ticket/${this.ticket._id}?void`, {}).toPromise().then((result: any) => {
      if (result && result.success) {
        this.dialogRef.close(this.ticket)
      }
    })
  }
  close() {
    this.dialogRef.close();
  }
}
