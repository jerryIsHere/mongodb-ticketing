import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../service/api.service';
import { Venue } from '../../management-panel/management-panel.component';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
  templateUrl: './venue-form.component.html',
  styleUrl: './venue-form.component.sass'
})
export class VenueFormComponent {
  venueForm: FormGroup = this._formBuilder.group({
    venuename: new FormControl(this.data?.venuename, [Validators.required]),
  });
  constructor(
    public dialogRef: MatDialogRef<VenueFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Venue,
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.venueForm.valid) {
      this.data.venuename = this.venueForm.controls["venuename"].value;
      if (this.data && this.data._id) {
        this.api.request.patch(`/venue/${this.data._id}`, this.data).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
      else {
        this.api.request.post("/venue?create", this.data).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
    }
  }
}
