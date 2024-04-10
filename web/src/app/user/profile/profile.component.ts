import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../service/api.service';
import { UserSessionService } from '../../service/user-session.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule, MatCheckbox, MatTooltipModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.sass'
})
export class ProfileComponent {
  profileForm: FormGroup = this._formBuilder.group({
    username: new FormControl('', [Validators.required]),
    fullname: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    singingPart: new FormControl('',),
  });
  passwordForm: FormGroup = this._formBuilder.group({
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
      return this.passwordForm ? control.value != this.passwordForm.controls["password"].value ? { confirmPasswordMissmatch: { value: control.value } } : null : null;
    }]),
  });
  constructor(
    private api: ApiService,
    private _formBuilder: FormBuilder, public userSession: UserSessionService,
  ) {
    this.loadFromSession()
  }
  async loadFromSession() {
    await this.userSession.checkUserSession()
    this.profileForm.controls["username"].setValue(this.userSession.user.username)
    this.profileForm.controls["fullname"].setValue(this.userSession.user.fullname)
    this.profileForm.controls["email"].setValue(this.userSession.user.email)
    this.profileForm.controls["singingPart"].setValue(this.userSession.user.singingPart)
  }
  updateProfile() {
    if (this.profileForm.valid) {
      this.api.user.updateProfile({
        fullname: this.profileForm.controls["fullname"].value,
        email: this.profileForm.controls["email"].value,
        singingPart: this.profileForm.controls["singingPart"].value,
      }).then((result) => {
        if (result && result.success) {

        }
      })
    }
  }
  updatePassword() {
    if (this.passwordForm.valid) {
      this.api.user.updatePassword({
        password: this.passwordForm.controls["password"].value,
      }).then((result) => {
        if (result && result.success) {

        }
      })
    }

  }
  activicationEmailSent = false
  sendActivicationEmail() {
    this.api.request.post('/user?resendVerification', {}).toPromise().then((result: any) => {
      if (result && result.success) {
        this.activicationEmailSent = true;
      }
    })
  }
}
