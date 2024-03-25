import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../service/api.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-seat-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './seat-form.component.html',
  styleUrl: './seat-form.component.sass'
})
export class SeatFormComponent {
  seatMatrixForm: FormGroup = this._formBuilder.group({
    nos: new FormControl('', [Validators.required]),
    rows: new FormControl('', [Validators.required,]),
  });
  constructor(
    public dialogRef: MatDialogRef<SeatFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { _id: string },
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.seatMatrixForm.valid &&
      typeof this.seatMatrixForm.controls["rows"].value == "string" &&
      typeof this.seatMatrixForm.controls["nos"].value == "string"
    ) {
      var seats: { row: string, no: string }[] = []
      for (let row of this.seatMatrixForm.controls["rows"].value.split(",")) {
        for (let col of this.seatMatrixForm.controls["nos"].value.split(",")) {
          seats.push({ row: row, no: col })
        }
      }
      this.api.request.post(`/seat?venueId=${this.data._id}&batch`, { seats: seats }).toPromise().then((result: any) => {
        if (result && result.success) {
          this.dialogRef.close(this.data)
        }
      })
    }
  }

}
