import { Component } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-message',
  standalone: true,
  imports: [MatRadioModule, MatIconModule, FormsModule, MatFormFieldModule],
  templateUrl: './payment-message.component.html',
  styleUrl: './payment-message.component.sass'
})
export class PaymentMessageComponent {
  view = "fps";

}
