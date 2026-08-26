import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

interface BlogPost {
  id: number;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog.html',
  styleUrl: './blog.scss'
})
export class BlogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  blogCategory = 'Blog & News';

  posts: BlogPost[] = [
    {
      id: 1,
      title: 'Top 10 Long-Lasting Flowers for Summer in Dubai',
      category: 'Bloom',
      date: 'August 5, 2026',
      excerpt: 'Discover which flower varieties thrive in warm climates and how to care for your luxury bouquets to keep them fresh.',
      image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589221/luxeflower/products/pvnfairvnobfaslglocp.jpg'
    },
    {
      id: 2,
      title: 'The Meaning Behind Rose Colors: Express Your Sentiments',
      category: 'News',
      date: 'July 28, 2026',
      excerpt: 'From passionate red to pure white and rare blue roses, learn the symbolic language of flowers before ordering.',
      image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589173/luxeflower/products/o8e5h1wpucz90wkvvcpg.jpg'
    },
    {
      id: 3,
      title: 'Luxeflower Launches Same-Day Luxury Hamper Delivery',
      category: 'News',
      date: 'July 15, 2026',
      excerpt: 'We are excited to expand our express delivery services across all seven Emirates with custom artisan hampers.',
      image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589211/luxeflower/products/w7ixnj1t1adicei6hdmn.jpg'
    }
  ];

  ngOnInit(): void {
    this.seo.set({
      title: 'Blog & News',
      description: 'Flower care tips, seasonal guides, and news from Luxeflower — the UAE flower delivery shop.'
    });

    this.route.url.subscribe(segments => {
      const pathStr = segments.map(s => s.path).join('/');
      if (pathStr) {
        const last = pathStr.split('/').pop() || pathStr;
        this.blogCategory = last.charAt(0).toUpperCase() + last.slice(1);
      }
    });
  }
}
