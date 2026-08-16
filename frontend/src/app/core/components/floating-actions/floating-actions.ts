import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './floating-actions.html',
  styleUrl: './floating-actions.scss'
})
export class FloatingActionsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  protected readonly storePhone = signal('+971500000000');

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: settings => {
        if (settings['STORE_PHONE']) this.storePhone.set(settings['STORE_PHONE']);
      },
      error: () => undefined
    });
  }

  get whatsappLink(): string {
    return `https://wa.me/${this.storePhone().replace(/[^0-9]/g, '')}`;
  }
}
