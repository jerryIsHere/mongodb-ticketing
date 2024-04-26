import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { UserSessionService } from './user-session.service';
import { Observable, catchError, of, map, finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ErrorMessageDialogComponent } from '../dialog/error-message-dialog/error-message-dialog.component';


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
  public requestInProgress = 0
  //static readonly endpoint: string = location.origin.includes("localhost") ? "http://localhost:3000" : "https://micro-ticketing-api.vercel.app"
  public user: UserApi
  public request: HttpClientLike
  constructor(private httpClient: HttpClient, public userSession: UserSessionService,
    public snackBar: MatSnackBar, public dialog: MatDialog) {
    let errorHandler = (defaultMsg: string = "Server is busy. Please try again later.") => {
      let handler = (errResponse: HttpErrorResponse) => {
        console.log(errResponse)
        if (errResponse.error) {
          if (errResponse.error.reason) {
            this.dialog.open(ErrorMessageDialogComponent, {
              data: { reasons: [errResponse.error.reason] }
            })
          }
          else if (errResponse.error.reasons) {
            this.dialog.open(ErrorMessageDialogComponent, {
              data: { reasons: errResponse.error.reasons }
            })
          }
          else {
            this.dialog.open(ErrorMessageDialogComponent, {
              data: { reasons: [defaultMsg] }
            })
          }
        }
        return of([])
      }
      return handler
    }
    let successHandler = (response: any) => {
      if (response && response.success) {
        this.snackBar.open("Request is successfully made.", "ok")
      }
      return response
    }
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
        return this.httpClient.get(url, options).pipe(
          // catchError(errorHandler("Our website is overloaded by excessive traffic. Please refresh page later."))
        )
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
      }, blockedByRequestInProgress = true) => {
        if (this.requestInProgress > 0 && blockedByRequestInProgress) throw new Error('request in progress');
        this.requestInProgress += 1
        console.log(this.requestInProgress)
        return this.httpClient.post(url, body, options).pipe(
          map(successHandler),
          catchError(errorHandler()),
          finalize(() => this.requestInProgress -= 1)
        )
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
      }, blockedByRequestInProgress = true) => {
        if (this.requestInProgress > 0 && blockedByRequestInProgress) throw new Error('request in progress');
        this.requestInProgress += 1
        console.log(this.requestInProgress)
        return this.httpClient.patch(url, body, options).pipe(
          map(successHandler),
          catchError(errorHandler()),
          finalize(() => this.requestInProgress -= 1)
        )
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
      }, blockedByRequestInProgress = true) => {
        if (this.requestInProgress > 0 && blockedByRequestInProgress) throw new Error('request in progress');
        this.requestInProgress += 1
        console.log(this.requestInProgress)
        return this.httpClient.delete(url, options).pipe(
          map(successHandler),
          catchError(errorHandler()),
          finalize(() => this.requestInProgress -= 1)
        )
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
      if (result && result.data) {
        window.localStorage.setItem("user", JSON.stringify(result.data));
        this.userSession.checkUserSession();
        return result
      }
    });

  }
  logout() {
    return this.httpClient.post(`/user?logout`, {}).toPromise().then((result: any) => {
      if (result && result.success) {
        window.localStorage.removeItem("user");
        this.userSession.checkUserSession();
        location.href = '/web'
        return
      }
    });
  }
  updateProfile(user: {
    fullname: string;
    email: string;
    singingPart: string;
  }) {
    return this.httpClient.patch(`/user/${this.userSession.user.username}?profile`, user).toPromise().then((result: any) => {
      if (result && result.data) {
        window.localStorage.setItem("user", JSON.stringify(result.data));
        this.userSession.checkUserSession();
        return result
      }
    });
  }
  updatePassword(cred: {
    password: string;
  }) {
    return this.httpClient.patch(`/user/${this.userSession.user.username}?password`, cred).toPromise().then((result: any) => {
      if (result && result.success) {
        this.userSession.checkUserSession();
        return result
      }
    });
  }
}