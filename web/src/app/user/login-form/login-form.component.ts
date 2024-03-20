import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.sass'
})
export class LoginFormComponent {
  loginForm: FormGroup = this._formBuilder.group({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),

  });
  @Output() logined = new EventEmitter<void>();
  constructor(private api: ApiService, private _formBuilder: FormBuilder) { }
  login() {
    if (this.loginForm.valid) {
      this.api.user.login({
        username: this.loginForm.controls["username"].value,
        password: this.loginForm.controls["password"].value
      }).then((result)=>{
        if(result && result.success) this.logined.emit();
      })
    }
  }
}
