import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../service/api.service';
import { VenueAPIObject } from '../../../../../mongoose-schema/interface_util';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatChipsModule, MatIconModule, MatIconModule, MatDialogModule],
  templateUrl: './venue-form.component.html',
  styleUrl: './venue-form.component.sass'
})
export class VenueFormComponent {
  venueForm: FormGroup = this._formBuilder.group({
    venuename: new FormControl(this.data?.venuename, [Validators.required]),
  });
  constructor(
    public dialogRef: MatDialogRef<VenueFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VenueAPIObject,
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  add(event: MatChipInputEvent) {
    const value = (event.value || '').trim().split('-');
    let x = Number(value[0])
    let y = Number(value[1])
    if (!Array.isArray(this.data.sections)) this.data.sections = []
    if (value && Number.isInteger(x) && Number.isInteger(y) && this.data.sections && this.data.sections.filter(s => s.x == x && s.y == y).length == 0) {

      this.data.sections.push({ x: Number(value[0]), y: Number(value[1]), options: null });
    }
    // Clear the input value
    event.chipInput!.clear();
  }
  remove(section: { x: number, y: number }): void {
    if (this.data.sections) {
      const index = this.data.sections.findIndex(s => s.x == section.x && s.y == section.y);

      if (index >= 0) {
        this.data.sections.splice(index, 1);
      }
    }
  }
  submit() {
    if (this.venueForm.valid && this.data.sections && this.data.sections.length > 0) {
      this.data.venuename = this.venueForm.controls["venuename"].value;
      if (this.data && this.data._id) {
        this.api.request.patch(`/venue/${this.data._id}`, { ...this.data, }).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
      else {
        this.api.request.post("/venue?create", { ...this.data, }).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
    }
  }
  close() {
    this.dialogRef.close();
  }
}
