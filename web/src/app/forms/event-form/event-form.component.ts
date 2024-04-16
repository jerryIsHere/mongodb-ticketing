import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../service/api.service';
import { Show, Venue } from '../../interface';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

var tolocaltimezone = (d: Date) => {
  d.setTime(d.getTime() - d.getTimezoneOffset() * 60000)
  return d
}

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatSelectModule, MatIconModule, MatDialogModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.sass'
})
export class EventFormComponent {
  eventForm: FormGroup = this._formBuilder.group({
    eventname: new FormControl(this.data.event.eventname, [Validators.required]),
    datetime: new FormControl(this.data.event.datetime ? tolocaltimezone(new Date(this.data.event.datetime)).toISOString().split('Z')[0] : '', [Validators.required,]),
    startFirstRoundSellDate: new FormControl(this.data.event.startFirstRoundSellDate ? tolocaltimezone(new Date(this.data.event.startFirstRoundSellDate)).toISOString().split('Z')[0] : '', [Validators.required,]),
    endFirstRoundSellDate: new FormControl(this.data.event.endFirstRoundSellDate ? tolocaltimezone(new Date(this.data.event.endFirstRoundSellDate)).toISOString().split('Z')[0] : '', [Validators.required,]),
    startSecondRoundSellDate: new FormControl(this.data.event.startSecondRoundSellDate ? tolocaltimezone(new Date(this.data.event.startSecondRoundSellDate)).toISOString().split('Z')[0] : '', [Validators.required,]),
    endSecondRoundSellDate: new FormControl(this.data.event.endSecondRoundSellDate ? tolocaltimezone(new Date(this.data.event.endSecondRoundSellDate)).toISOString().split('Z')[0] : '', [Validators.required,]),
    duration: new FormControl(this.data.event.duration, [Validators.required, Validators.min(0), Validators.pattern("^[-0-9]*$"),]),
    shoppingCartSize: new FormControl(this.data.event.shoppingCartSize, [Validators.required, Validators.pattern("^[-0-9]*$"),]),
    firstRoundTicketQuota: new FormControl(this.data.event.firstRoundTicketQuota, [Validators.required, Validators.pattern("^[-0-9]*$"),]),
    secondRoundTicketQuota: new FormControl(this.data.event.secondRoundTicketQuota, [Validators.required, Validators.pattern("^[-0-9]*$"),]),
    venueId: new FormControl(this.data.event.venueId, [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: Show, venues: Venue[] },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) {
  }
  submit() {
    console.log(this.eventForm.controls["eventname"].value)
    if (this.eventForm.valid) {
      let timezone = (new Date()).getTimezoneOffset() * 60000
      let body = this.eventForm.getRawValue()
      body.startFirstRoundSellDate = new Date(body.startFirstRoundSellDate);
      body.endFirstRoundSellDate = new Date(body.endFirstRoundSellDate);
      body.startSecondRoundSellDate = new Date(body.startSecondRoundSellDate);
      body.endSecondRoundSellDate = new Date(body.endSecondRoundSellDate);
      if (this.data && this.data.event && this.data.event._id) {
        this.api.request.patch(`/event/${this.data.event._id}`, body).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(body)
          }
        })
      }
      else {
        this.api.request.post("/event?create", body).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(body)
          }
        })
      }
    }
  }
  close() {
    this.dialogRef.close();
  }
}
