import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  private newsletterService = inject(NewsletterService);
  private notifications = inject(NotificationService);

  protected readonly customerServices = [
    { label: 'About Us', link: '/about' },
    { label: 'Contact Us', link: '/contact' },
    { label: 'Blog', link: '/blog' }
  ];

  protected readonly policies = [
    { label: 'Privacy Policy', link: '/privacy-policy' },
    { label: 'Shipping Policy', link: '/shipping-policy' },
    { label: 'Terms of Service', link: '/terms-of-service' },
    { label: 'Refund and Return policy', link: '/refund-policy' }
  ];

  protected readonly currentYear = new Date().getFullYear();

  protected newsletterEmail = signal('');
  protected subscribing = signal(false);

  subscribeNewsletter(): void {
    const email = this.newsletterEmail().trim();
    if (!email) return;

    this.subscribing.set(true);
    this.newsletterService.subscribe(email).subscribe({
      next: () => {
        this.subscribing.set(false);
        this.newsletterEmail.set('');
        this.notifications.success('Thanks for subscribing! Watch your inbox for offers.');
      },
      error: err => {
        this.subscribing.set(false);
        if (err.status === 409) {
          this.notifications.info("You're already subscribed to our newsletter.");
        }
      }
    });
  }
}
