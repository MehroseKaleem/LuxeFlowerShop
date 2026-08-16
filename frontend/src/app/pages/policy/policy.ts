import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.html',
  styleUrl: './policy.scss'
})
export class PolicyComponent implements OnInit {
  private route = inject(ActivatedRoute);

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
    });
  }
}
