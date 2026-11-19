import type { ClientStatus } from '@/types/domain';

export interface AdminClient {
  id: string;
  slug: string;
  name: string;
  username: string;
  bio: string;
  category: string;
  website: string;
  avatar_path: string | null;
  followers_count: number;
  following_count: number;
  status: ClientStatus;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export type AdminClientInput = Omit<AdminClient, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export interface ClientCounters {
  pending: number;
  changes_requested: number;
  approved: number;
  unread_reviews: number;
}

export type ClientSummary = AdminClient & ClientCounters;
