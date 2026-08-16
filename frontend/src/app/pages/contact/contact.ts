import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent implements OnInit {
  private contactService = inject(ContactService);
  private settingsService = inject(SettingsService);
  private notifications = inject(NotificationService);

  protected readonly storePhone = signal('+971500000000');
  protected readonly storeEmail = signal('support@karazflowers.ae');
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  protected form = { name: '', email: '', phone: '', message: '' };

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: settings => {
        if (settings['STORE_PHONE']) this.storePhone.set(settings['STORE_PHONE']);
        if (settings['STORE_EMAIL']) this.storeEmail.set(settings['STORE_EMAIL']);
      },
      error: () => undefined
    });
  }

  get whatsappLink(): string {
    return `https://wa.me/${this.storePhone().replace(/[^0-9]/g, '')}`;
  }

  submit(): void {
    if (!this.form.email.trim() || !this.form.message.trim()) {
      this.notifications.error('Please provide your email and a message.');
      return;
    }

    this.submitting.set(true);
    this.contactService
      .submit({
        name: this.form.name.trim() || 'Website visitor',
        email: this.form.email.trim(),
        phone: this.form.phone.trim() || undefined,
        message: this.form.message.trim()
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.form = { name: '', email: '', phone: '', message: '' };
        },
        error: () => this.submitting.set(false)
      });
  }
}
