import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatDialogModule],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.sass'
})
export class ShowListComponent {
  public events: Event[] | null = null;

}

export interface Event {
  name: string;
}