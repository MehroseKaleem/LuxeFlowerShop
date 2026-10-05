import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { BLOG_POSTS } from './blog-posts.data';

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

  activeCategory: string | null = null;
  posts = BLOG_POSTS;

  get blogCategory(): string {
    return this.activeCategory || 'Blog & News';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const category = params.get('category');
      this.activeCategory = category;
      this.posts = category
        ? BLOG_POSTS.filter(p => p.category.toLowerCase() === category.toLowerCase())
        : BLOG_POSTS;

      this.seo.set({
        title: category ? `${category} | Blog` : 'Blog & News',
        description: 'Flower care tips, seasonal guides, and news from Luxeflower — the UAE flower delivery shop.'
      });
    });
  }
}
