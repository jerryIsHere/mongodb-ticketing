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
      if (document.cookie) {
        let userObjectJson = window.localStorage.getItem("user")
        if (userObjectJson) {
          this.user = JSON.parse(decodeURIComponent(userObjectJson))
        }
      }
      else {
        window.localStorage.removeItem("user")
        this.user = null
      }
    }
    catch (err) {

    }
    return this.user
  }
}
