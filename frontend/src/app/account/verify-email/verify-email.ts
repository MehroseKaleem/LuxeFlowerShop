import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmailComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  protected readonly verifying = signal(true);
  protected readonly success = signal(false);

  ngOnInit(): void {
    this.seo.set({ title: 'Verify Email', description: 'Verify your Luxeflower account email.', noindex: true });

    const token = this.route.snapshot.paramMap.get('token') || '';
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.verifying.set(false);
        this.success.set(true);
      },
      error: () => {
        this.verifying.set(false);
        this.success.set(false);
      }
    });
  }
}
