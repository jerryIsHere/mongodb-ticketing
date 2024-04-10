import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [MatButtonModule, RouterModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.sass'
})
export class ResetPasswordComponent {
  passwordForm: FormGroup = this._formBuilder.group({
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
      return this.passwordForm ? control.value != this.passwordForm.controls["password"].value ? { confirmPasswordMissmatch: { value: control.value } } : null : null;
    }]),
  });
  constructor(
    private route: ActivatedRoute, private api: ApiService,
    private _formBuilder: FormBuilder,
  ) {

  }
  token?: string
  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let token = params.get('token')
      if (token != null)
        this.token = token
    })
  }
  requesting = false
  reset() {
    if (this.token && this.passwordForm.valid && !this.requesting) {
      this.requesting = true
      this.api.request.patch(`/user/reset-password/${this.token}`, { newPassword: this.passwordForm.controls["password"].value }).toPromise().then((result: any) => {
        if (result && typeof result.success == "boolean") {
          location.href = '/web'
        }
      })
    }
  }
}
