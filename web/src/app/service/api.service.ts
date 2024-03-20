import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserSessionService } from './user-session.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  static readonly endpoint: string = location.origin.includes("localhost") ? "http://localhost:3000" : "https://micro-ticketing-api.vercel.app"
  public user: UserApi
  constructor(public httpClient: HttpClient, public userSession: UserSessionService) {
    this.user = new UserApi(httpClient, userSession)
  }
}

class UserApi {
  constructor(public httpClient: HttpClient, public userSession: UserSessionService) { }
  register(user: {
    username: string;
    fullname: string;
    email: string;
    singingPart: string;
    password: string
  }) {
    return this.httpClient.post(ApiService.endpoint + "/user?register", user).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return result
      }
    });
  }
  login(credential: {
    username: string;
    password: string
  }) {
    return this.httpClient.post(ApiService.endpoint + `/user?login`, credential).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return result
      }
    });

  }
  logout() {
    return this.httpClient.post(ApiService.endpoint + `/user?logout`, {}).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return
      }
    });
  }
}