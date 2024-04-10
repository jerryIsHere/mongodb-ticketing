import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../service/api.service';
@Component({
  selector: 'app-forget-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forget-form.component.html',
  styleUrl: './forget-form.component.sass'
})
export class ForgetFormComponent {
  forgetForm: FormGroup = this._formBuilder.group({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),

  });
  constructor(private api: ApiService, private _formBuilder: FormBuilder) { }
  dirty: boolean = false
  sent: boolean = false

  forget() {
    this.dirty = true
    if (this.valid()) {
      let body = this.forgetForm.controls['username'].value ?
        { username: this.forgetForm.controls['username'].value } :
        { email: this.forgetForm.controls['email'].value }
      this.api.request.post('/user/forget-password', body).toPromise().then((result: any) => {
        if (result) {
          this.sent = result.success
        }
      })
    }
  }
  valid() {
    return this.forgetForm.controls['username'].value || this.forgetForm.controls['email'].value
  }
}
