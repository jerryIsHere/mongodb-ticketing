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
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatAutocompleteModule, MatButtonModule,
    ReactiveFormsModule, MatInputModule,
    AsyncPipe],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.sass'
})
export class UserProfileComponent {
  userSearch = new FormControl<string>('', [Validators.required]);
  profileForm: FormGroup = this._formBuilder.group({
    user: this.userSearch,
    fullname: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    singingPart: new FormControl('',),
  });
  users: UserAPIObject[] = [];
  filteredUsers: Observable<UserAPIObject[]> = new Observable<UserAPIObject[]>();
  selectedUser?: UserAPIObject;
  constructor(private api: ApiService,
    private _formBuilder: FormBuilder, public dialogRef: MatDialogRef<UserProfileComponent>) {
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
      this.profileForm.controls["fullname"].setValue(this.selectedUser?.fullname)
      this.profileForm.controls["email"].setValue(this.selectedUser?.email)
      this.profileForm.controls["singingPart"].setValue(this.selectedUser?.singingPart)
   
    }
  }
  requesting: boolean = false
  updateProfile() {
    if (this.profileForm.valid && !this.requesting) {
      this.requesting = true
      this.api.request.patch(`/user/${this.profileForm.controls["user"].value.username}`, { profile: this.profileForm.getRawValue() }).toPromise().then((result: any) => {
        if (result && result.success) {
          this.dialogRef.close();
        }
      })
    }
  }

}
