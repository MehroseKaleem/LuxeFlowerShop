import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

const POLICY_TITLES: Record<string, string> = {
  privacy: 'Privacy Policy',
  shipping: 'Shipping Policy',
  terms: 'Terms of Service',
  refund: 'Refund & Return Policy'
};

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.html',
  styleUrl: './policy.scss'
})
export class PolicyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  policyType = 'privacy';

  ngOnInit(): void {
    this.route.url.subscribe(segments => {
      const path = segments.map(s => s.path).join('/');
      if (path.includes('shipping')) {
        this.policyType = 'shipping';
      } else if (path.includes('terms')) {
        this.policyType = 'terms';
      } else if (path.includes('refund')) {
        this.policyType = 'refund';
      } else {
        this.policyType = 'privacy';
      }

      this.seo.set({
        title: POLICY_TITLES[this.policyType],
        description: `Read Luxeflower's ${POLICY_TITLES[this.policyType].toLowerCase()} for online flower orders and delivery across the UAE.`
      });
    });
  }
}
