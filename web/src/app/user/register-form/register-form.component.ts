import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.sass'
})
export class RegisterFormComponent {

  registerForm: FormGroup = this._formBuilder.group({
    username: new FormControl('', [Validators.required]),
    fullname: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
      return this.registerForm ? control.value != this.registerForm.controls["password"].value ? { confirmPasswordMissmatch: { value: control.value } } : null : null;
    }]),
    singingPart: new FormControl('',),
  });
  @Output() logined = new EventEmitter<void>();
  constructor(private api: ApiService, private _formBuilder: FormBuilder) { }
  register() {
    if (this.registerForm.valid) {
      this.api.user.register({
        username: this.registerForm.controls["username"].value,
        fullname: this.registerForm.controls["fullname"].value,
        email: this.registerForm.controls["email"].value,
        password: this.registerForm.controls["password"].value,
        singingPart: this.registerForm.controls["singingPart"].value,
      }).then((result) => {
        if (result && result.success) {
          this.logined.emit();
        }
      })
    }
  }

}
