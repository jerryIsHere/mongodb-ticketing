import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { cookieStore } from 'cookie-store';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  user: any
  constructor() {
    this.checkUserSession()
  }
  checkUserSession() {
    return cookieStore.get("user").then((cookie: any) => {
      if (cookie && cookie.value) { this.user = JSON.parse(decodeURIComponent(cookie.value)) } else {
        this.user = null
      }
      return this.user
    });
  }
}
