import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-message',
  standalone: true,
  imports: [MatTabsModule, MatIconModule],
  templateUrl: './payment-message.component.html',
  styleUrl: './payment-message.component.sass'
})
export class PaymentMessageComponent {

}
