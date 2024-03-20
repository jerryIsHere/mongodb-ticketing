import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-management-panel',
  standalone: true,
  imports: [MatIconModule, MatTableModule, MatDialogModule, MatCardModule],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.sass'
})
export class ManagementPanelComponent {
  public events: Event[] | null = null;

}

export interface Event {
  name: string;
}