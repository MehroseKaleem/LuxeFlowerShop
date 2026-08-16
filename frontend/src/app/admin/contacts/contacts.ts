import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { NotificationService } from '../../core/services/notification.service';
import { ContactMessage } from '../../models/contact.model';

type StatusFilter = 'all' | 'unread' | 'read' | 'replied';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss'
})
export class ContactsComponent implements OnInit {
  private contactService = inject(ContactService);
  private notifications = inject(NotificationService);

  messages = signal<ContactMessage[]>([]);
  total = signal(0);
  loading = signal(true);
  statusFilter = signal<StatusFilter>('all');
  searchQuery = signal<string>('');

  expandedMessageId = signal<number | null>(null);
  showReplyModal = signal<boolean>(false);
  selectedMessage = signal<ContactMessage | null>(null);
  replyText = signal<string>('');
  sendingReply = signal(false);

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.loading.set(true);
    this.contactService.adminList({ limit: 100 }).subscribe({
      next: ({ items, meta }) => {
        this.messages.set(items);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  statusOf(msg: ContactMessage): 'unread' | 'read' | 'replied' {
    if (msg.repliedAt) return 'replied';
    return msg.isRead ? 'read' : 'unread';
  }

  matchesFilters(msg: ContactMessage): boolean {
    if (this.statusFilter() !== 'all' && this.statusOf(msg) !== this.statusFilter()) return false;
    const q = this.searchQuery().toLowerCase();
    if (!q) return true;
    return msg.name.toLowerCase().includes(q) || msg.email.toLowerCase().includes(q) || (msg.subject || '').toLowerCase().includes(q);
  }

  toggleMessage(id: number) {
    if (this.expandedMessageId() === id) {
      this.expandedMessageId.set(null);
      return;
    }

    this.expandedMessageId.set(id);
    const msg = this.messages().find(m => m.id === id);
    if (msg && !msg.isRead) this.markAsRead(id);
  }

  markAsRead(id: number) {
    this.contactService.adminMarkRead(id).subscribe({
      next: updated => this.messages.update(list => list.map(m => (m.id === id ? updated : m)))
    });
  }

  deleteMessage(id: number) {
    if (!confirm('Delete this message?')) return;
    this.contactService.adminDelete(id).subscribe({ next: () => this.loadMessages() });
  }

  openReplyModal(msg: ContactMessage, event: Event) {
    event.stopPropagation();
    this.selectedMessage.set(msg);
    this.replyText.set('');
    this.showReplyModal.set(true);
  }

  closeReplyModal() {
    this.showReplyModal.set(false);
    this.selectedMessage.set(null);
  }

  sendReply() {
    const msg = this.selectedMessage();
    const text = this.replyText().trim();
    if (!msg || !text) return;

    this.sendingReply.set(true);
    this.contactService.adminReply(msg.id, text).subscribe({
      next: updated => {
        this.sendingReply.set(false);
        this.messages.update(list => list.map(m => (m.id === msg.id ? updated : m)));
        this.notifications.success('Reply sent');
        this.closeReplyModal();
      },
      error: () => this.sendingReply.set(false)
    });
  }
}
