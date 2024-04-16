import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  user: any
  constructor() {
    this.checkUserSession()
  }
  checkUserSession() {
    try {
      let userObjectJson = window.localStorage.getItem("user")
      if(userObjectJson){
        this.user = JSON.parse(decodeURIComponent(userObjectJson))
      }
    }
    catch (err) {

    }
    return this.user
  }
}
