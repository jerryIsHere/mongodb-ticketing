import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Event } from '../management-panel/management-panel.component'
import { ApiService } from '../service/api.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, RouterModule],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.sass'
})
export class ShowListComponent {
  public events: Event[] | null = null;
  constructor(private api: ApiService) {
    this.loadData()
  }
  loadData() {
    return this.api.httpClient.get("/event?list").toPromise().then((result: any) => {
      if (result && result.data)
        this.events = result.data
    })
  }
}
