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
      title: 'Why Red Roses Remain the Ultimate Symbol of Love',
      category: 'Bloom',
      date: 'August 5, 2026',
      excerpt: 'From grand anniversaries to quiet everyday gestures, discover why a hand-tied red rose bouquet still says "I love you" better than anything else — and how to keep one fresh for longer.',
      image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589221/luxeflower/products/pvnfairvnobfaslglocp.jpg'
    },
    {
      id: 2,
      title: 'The Meaning Behind Rose Colors: Express Your Sentiments',
      category: 'News',
      date: 'July 28, 2026',
      excerpt: 'Pink roses speak of gratitude and admiration, while deep red carries passion and pure white marks new beginnings — learn the symbolic language of roses before you order your next bouquet.',
      image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589173/luxeflower/products/o8e5h1wpucz90wkvvcpg.jpg'
    },
    {
      id: 3,
      title: 'White Roses: Timeless Elegance for Weddings & New Beginnings',
      category: 'News',
      date: 'July 15, 2026',
      excerpt: 'Nothing captures purity and grace quite like a pristine white rose arrangement. See why they remain the top choice for weddings, engagements, and life\'s most meaningful milestones.',
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
