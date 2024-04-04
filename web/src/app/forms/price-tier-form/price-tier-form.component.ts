import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../service/api.service';
import { PriceTier } from '../../interface';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

@Component({
  selector: 'app-price-tier-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule, MatDialogModule],
  templateUrl: './price-tier-form.component.html',
  styleUrl: './price-tier-form.component.sass'
})
export class PriceTierFormComponent {
  priceTierForm: FormGroup = this._formBuilder.group({
    tierName: new FormControl(this.data.tierName, [Validators.required]),
    price: new FormControl(this.data.price, [Validators.required, Validators.min(0), Validators.pattern("^[0-9]*$"),]),
  });
  constructor(
    public dialogRef: MatDialogRef<PriceTierFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PriceTier,
    private api: ApiService,
    private _formBuilder: FormBuilder
  ) { }
  submit() {
    if (this.priceTierForm.valid) {
      this.data.tierName = this.priceTierForm.controls["tierName"].value;
      this.data.price = this.priceTierForm.controls["price"].value;
      if (this.data && this.data._id) {
        this.api.request.patch(`/priceTier/${this.data._id}`, this.data).toPromise().then((result: any) => {
          if (result && result.success) {
            this.dialogRef.close(this.data)
          }
        })
      }
      else {
        this.api.request.post("/priceTier?create", this.data).toPromise().then((result: any) => {
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
