import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [MatButtonModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.sass'
})
export class VerifyComponent {
  verified?: boolean = undefined
  constructor(private route: ActivatedRoute, private api: ApiService) { }
  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let token = params.get('token')
      if (token != null)
        this.api.request.post(`/user/verify/${token}`, {}).toPromise().then((result: any) => {
          if (result && typeof result.success == "boolean") {
            this.verified = result.success
          }
        })
    })
  }
}
