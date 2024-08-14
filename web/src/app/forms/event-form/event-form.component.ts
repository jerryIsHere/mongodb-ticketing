import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../service/api.service';
import { ShowAPIObject, VenueAPIObject } from '../../../../../mongoose-schema/interface_util';
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
  eventForm = this._formBuilder.group({
    eventname: new FormControl(this.data.event.eventname, [Validators.required]),
    datetime: new FormControl(this.data.event.datetime ? tolocaltimezone(new Date(this.data.event.datetime)).toISOString().split('Z')[0] : '', [Validators.required,]),
    saleInfos: new FormArray(
      [0, 1].map(i =>
        this.data.event.saleInfos[i] ?
          this._formBuilder.group(
            {
              start: new FormControl(tolocaltimezone(new Date(this.data.event.saleInfos[0].start)).toISOString().split('Z')[0], [Validators.required,]),
              end: new FormControl(tolocaltimezone(new Date(this.data.event.saleInfos[0].end)).toISOString().split('Z')[0], [Validators.required,]),
              ticketQuota: new FormControl(this.data.event.saleInfos[i].ticketQuota, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
            }) :
          this._formBuilder.group(
            {
              start: new FormControl('', [Validators.required,]),
              end: new FormControl('', [Validators.required,]),
              ticketQuota: new FormControl('', [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
            })
      )
    ),
    priceTiers: new FormArray(
      this.data.event.priceTiers.map(priceTier =>
        this._formBuilder.group(
          {
            tierName: new FormControl(priceTier.tierName, [Validators.required]),
            price: new FormControl(priceTier.price, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
          }))
    ),
    duration: new FormControl(this.data.event.duration, [Validators.required, Validators.min(0), Validators.pattern("^[-0-9]*$"),]),
    shoppingCartSize: new FormControl(this.data.event.shoppingCartSize, [Validators.required, Validators.pattern("^[-0-9]*$"),]),
    venueId: new FormControl(this.data.event.venueId, [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: ShowAPIObject, venues: VenueAPIObject[] },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) {
  }
  submit() {
    console.log(this.eventForm.controls["eventname"].value)
    if (this.eventForm.valid) {
      let timezone = (new Date()).getTimezoneOffset() * 60000
      let formData = this.eventForm.getRawValue()
      let body = {
        ...{
          datetime: new Date(formData.datetime ? formData.datetime : ''),
          saleInfos: formData.saleInfos.map(info => {
            return {
              start: info.start ? new Date(info.start) : '',
              end: info.end ? new Date(info.end) : '',
              ticketQuota: info.ticketQuota,
            }
          })
        },
        ...formData
      }
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
