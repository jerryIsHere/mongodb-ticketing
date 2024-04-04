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
    datetime: new FormControl(this.data.event.datetime ? new Date(this.data.event.datetime).toISOString().split('Z')[0] : '', [Validators.required,]),
    duration: new FormControl(this.data.event.duration, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
    venueId: new FormControl(this.data.event.venueId, [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: Show, venues: Venue[] },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) {
    console.log(this.data.event.datetime ? new Date(this.data.event.datetime).toISOString().split('Z')[0] : '')
  }
  submit() {
    console.log(this.eventForm.controls["eventname"].value)
    if (this.eventForm.valid) {
      this.data.event.eventname = this.eventForm.controls["eventname"].value;
      this.data.event.datetime = this.eventForm.controls["datetime"].value;
      this.data.event.duration = this.eventForm.controls["duration"].value;
      this.data.event.venueId = this.eventForm.controls["venueId"].value;
      if (this.data && this.data.event && this.data.event._id) {
        this.api.request.patch(`/event/${this.data.event._id}`, this.data.event).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
      else {
        this.api.request.post("/event?create", this.data.event).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data.event)
          }
        })
      }
    }
  }
  close() {
    this.dialogRef.close();
  }
}
