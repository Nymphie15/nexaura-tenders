// Comments & Annotations Types (#25)

export interface Comment {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface CommentThread {
  id: string;
  resource_type: "workflow" | "tender" | "decision";
  resource_id: string;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
  comments: Comment[];
}

export interface CreateCommentRequest {
  title?: string;
  content: string;
  mentions?: string[];
}

export interface ReplyCommentRequest {
  content: string;
  mentions?: string[];
}

export interface EditCommentRequest {
  content: string;
}
