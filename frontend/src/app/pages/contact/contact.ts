import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ContactService } from '../../services/contact.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { SeoService } from '../../core/services/seo.service';
import { formatApiError } from '../../shared/utils/api-error.util';

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
  private seo = inject(SeoService);

  protected readonly storePhone = signal('+971500000000');
  protected readonly storeEmail = signal('support@luxefloweruae.com');
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  protected form = { name: '', email: '', phone: '', message: '' };

  ngOnInit(): void {
    this.seo.set({
      title: 'Contact Us',
      description: 'Get in touch with Luxeflower — call, WhatsApp, or send a message for orders, custom bouquet requests, or support.'
    });

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
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.notifications.error(formatApiError(err, 'Could not send your message. Please try again.'));
        }
      });
  }
}
