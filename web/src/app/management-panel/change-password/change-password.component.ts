import { Component } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { UserAPIObject } from '../../api-util';
import { map, Observable, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule, MatButtonModule,
    ReactiveFormsModule, MatInputModule,
    AsyncPipe],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.sass'
})
export class ChangePasswordComponent {
  userSearch = new FormControl<string>('', [Validators.required]);
  passwordForm: FormGroup = this._formBuilder.group({
    username: this.userSearch,
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
      return this.passwordForm ? control.value != this.passwordForm.controls["password"].value ? { confirmPasswordMissmatch: { value: control.value } } : null : null;
    }]),
  });
  users: UserAPIObject[] = [];
  filteredUsers: Observable<UserAPIObject[]> = new Observable<UserAPIObject[]>();
  selectedUser?: UserAPIObject;
  constructor(private api: ApiService,
    private _formBuilder: FormBuilder, public dialogRef: MatDialogRef<ChangePasswordComponent>) {
    this.loadData()
  }
  userDisplayFn(usernameOrUser: string | UserAPIObject): string {
    if (typeof usernameOrUser == "string") {
      let user = this.users?.find(user => user.username == usernameOrUser)
      return `${user ? user.fullname : ''}(${usernameOrUser})`
    }
    else {
      return `${usernameOrUser.fullname}(${usernameOrUser.username})`
    }
  }
  private _userFilter(keywords: string): UserAPIObject[] {
    const filterValue = keywords.toLowerCase();
    if (this.users) {
      return this.users.filter(user =>
        user.fullname?.toLowerCase().includes(filterValue) ||
        user.singingPart?.toLowerCase()?.includes(filterValue) ||
        user.email?.toLowerCase()?.includes(filterValue) ||
        user.username?.toLowerCase()?.includes(filterValue) ||
        user._id?.toLowerCase()?.includes(filterValue)
      );
    }
    else {
      return []
    }
  }
  loadData() {
    this.api.request.get("/user?list").toPromise().then((result: any) => {
      if (result && result.data) {
        this.users = result.data
        this.filteredUsers = this.userSearch.valueChanges.pipe(
          startWith(''),
          map(value => {
            if (typeof value == "string") {
              this.selectedUser = undefined;
              const keywords = value
              return keywords ? this._userFilter(keywords as string) : this.users.slice();
            }
            return this.users
          }),
        );
      }
    })
  }
  userSelected(event: MatAutocompleteSelectedEvent) {
    if (event?.option?.value?._id) {
      this.selectedUser = this.users.find(user => user._id == event?.option?.value?._id)
      this.passwordForm.controls["username"].setValue(this.selectedUser?.username)
    }
  }
  requesting: boolean = false
  reset() {
    if (this.passwordForm.valid && !this.requesting) {
      this.requesting = true
      this.api.request.patch(`/user/${this.passwordForm.controls["username"].value}`, { password: this.passwordForm.controls["password"].value }).toPromise().then((result: any) => {
        if (result && result.success) {
          this.dialogRef.close();
        }
      })
    }
  }
}
