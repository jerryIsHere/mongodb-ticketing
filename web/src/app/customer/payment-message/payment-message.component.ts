import { Component } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-message',
  standalone: true,
  imports: [MatSelectModule, MatIconModule],
  templateUrl: './payment-message.component.html',
  styleUrl: './payment-message.component.sass'
})
export class PaymentMessageComponent {
  view="fps";

}
