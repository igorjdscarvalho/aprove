export type ClientStatus = 'unpublished' | 'published' | 'archived';
export type PostType = 'image' | 'carousel' | 'reel' | 'story';
export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';
export type ReviewDecision = 'approved' | 'changes_requested';
export type MediaKind = 'image' | 'video';
export type AspectRatio = '1:1' | '4:5' | '1.91:1' | '9:16';

export interface Media {
  id: string;
  position: number;
  kind: MediaKind;
  path: string;
  poster_path: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
}

export interface Review {
  decision: ReviewDecision;
  comment: string;
  reviewer_name: string;
  revision: number;
  created_at: string;
}

export interface Post {
  id: string;
  type: PostType;
  caption: string;
  location: string;
  audio_name: string;
  scheduled_date: string; // 'YYYY-MM-DD'
  scheduled_time: string | null; // 'HH:MM:SS'
  approval_status: ApprovalStatus;
  revision: number;
  aspect_ratio: AspectRatio;
  cover_path: string | null;
  grid_crop_x: number;
  grid_crop_y: number;
  story_seconds: number;
  media: Media[];
  reviews: Review[];
}

export interface ClientProfile {
  name: string;
  username: string;
  bio: string;
  category: string;
  website: string;
  avatar_path: string | null;
  followers_count: number;
  following_count: number;
}

export interface FeedData {
  client: ClientProfile;
  posts: Post[];
}
