import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserSessionService } from './user-session.service';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';


type HttpClientLike = {
  get: (url: string, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    context?: HttpContext;
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
    transferCache?: {
      includeHeaders?: string[];
    } | boolean;
  }) => Observable<Object>,

  post: (url: string, body: any | null, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    context?: HttpContext;
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
    transferCache?: {
      includeHeaders?: string[];
    } | boolean;
  }) => Observable<Object>,

  patch: (url: string, body: any | null, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    context?: HttpContext;
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
  }) => Observable<Object>,
  delete: (url: string, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    context?: HttpContext;
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
    body?: any | null;
  }) => Observable<Object>
}
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  //static readonly endpoint: string = location.origin.includes("localhost") ? "http://localhost:3000" : "https://micro-ticketing-api.vercel.app"
  public user: UserApi
  public request: HttpClientLike
  constructor(private httpClient: HttpClient, public userSession: UserSessionService, public snackBar: MatSnackBar) {
    this.request = {
      get: (url: string, options?: {
        headers?: HttpHeaders | {
          [header: string]: string | string[];
        };
        context?: HttpContext;
        observe?: 'body';
        params?: HttpParams | {
          [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        transferCache?: {
          includeHeaders?: string[];
        } | boolean;
      }) => {
        return this.httpClient.get(url, options).pipe((err: any) => {
          console.log(err)
          if (err && err.success != undefined && err.success == false) {
            this.snackBar.open(err.message);
          }
          else { return err }
        })
      },

      post: (url: string, body: any | null, options?: {
        headers?: HttpHeaders | {
          [header: string]: string | string[];
        };
        context?: HttpContext;
        observe?: 'body';
        params?: HttpParams | {
          [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        transferCache?: {
          includeHeaders?: string[];
        } | boolean;
      }) => {
        return this.httpClient.post(url, body, options).pipe((err: any) => {
          console.log(err)
          if (err && err.success != undefined && err.success == false) {
            this.snackBar.open(err.message);
          }
          else { return err }
        })
      },

      patch: (url: string, body: any | null, options?: {
        headers?: HttpHeaders | {
          [header: string]: string | string[];
        };
        context?: HttpContext;
        observe?: 'body';
        params?: HttpParams | {
          [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
      }) => {
        return this.httpClient.patch(url, body, options).pipe((err: any) => {
          console.log(err)
          if (err && err.success != undefined && err.success == false) {
            this.snackBar.open(err.message);
          }
          else { return err }
        })
      },
      delete: (url: string, options?: {
        headers?: HttpHeaders | {
          [header: string]: string | string[];
        };
        context?: HttpContext;
        observe?: 'body';
        params?: HttpParams | {
          [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
        body?: any | null;
      }) => {
        return this.httpClient.delete(url, options).pipe((err: any) => {
          console.log(err)
          if (err && err.success != undefined && err.success == false) {
            this.snackBar.open(err.message);
          }
          else { return err }
        })
      }
    }
    this.user = new UserApi(this.request, userSession)
  }
}

class UserApi {

  constructor(public httpClient: HttpClientLike, public userSession: UserSessionService,) { }
  register(user: {
    username: string;
    fullname: string;
    email: string;
    singingPart: string;
    password: string
  }) {
    return this.httpClient.post("/user?register", user).toPromise().then((result: any) => {
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
    return this.httpClient.post(`/user?login`, credential).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return result
      }
    });

  }
  logout() {
    return this.httpClient.post(`/user?logout`, {}).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return
      }
    });
  }
}