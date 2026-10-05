import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { BLOG_POSTS, BlogPost } from '../blog/blog-posts.data';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss'
})
export class BlogPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  protected readonly post = signal<BlogPost | null>(null);
  protected readonly notFound = signal(false);

  protected get otherPosts(): BlogPost[] {
    const current = this.post();
    return BLOG_POSTS.filter(p => p.id !== current?.id).slice(0, 3);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      const found = BLOG_POSTS.find(p => p.slug === slug) ?? null;
      this.post.set(found);
      this.notFound.set(!found);

      if (found) {
        this.seo.set({
          title: found.title,
          description: found.excerpt,
          image: found.image,
          type: 'article'
        });
        this.seo.setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: found.title,
          description: found.excerpt,
          image: found.image,
          datePublished: found.date,
          author: { '@type': 'Organization', name: 'Luxeflower' },
          publisher: { '@type': 'Organization', name: 'Luxeflower', logo: { '@type': 'ImageObject', url: 'https://luxefloweruae.com/logo.png' } }
        });
      } else {
        this.seo.set({ title: 'Article Not Found', description: 'This blog article could not be found.', noindex: true });
      }
    });
  }
}
