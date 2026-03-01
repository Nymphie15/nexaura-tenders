"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useCommentThreads,
  useCreateThread,
  useReplyToThread,
  useResolveThread,
  useEditComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import type { CommentThread, Comment } from "@/types/comments";

interface CommentsSidebarProps {
  resourceType: "workflow" | "tender" | "decision";
  resourceId: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
}

function SingleComment({
  comment,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {comment.author_name}
        </span>
        <div className="flex items-center gap-1">
          {comment.is_edited && (
            <span className="text-xs text-gray-400">(modifie)</span>
          )}
          <span className="text-xs text-gray-400">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-1">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {comment.content}
        </p>
      )}
      {!isEditing && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete(comment.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  resourceType,
  resourceId,
}: {
  thread: CommentThread;
  resourceType: "workflow" | "tender" | "decision";
  resourceId: string;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [showReply, setShowReply] = useState(false);

  const replyMutation = useReplyToThread(resourceType, resourceId);
  const resolveMutation = useResolveThread(resourceType, resourceId);
  const editMutation = useEditComment(resourceType, resourceId);
  const deleteMutation = useDeleteComment(resourceType, resourceId);

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(
      { threadId: thread.id, data: { content: replyContent.trim() } },
      {
        onSuccess: () => {
          setReplyContent("");
          setShowReply(false);
        },
      }
    );
  };

  const handleEdit = (commentId: string, content: string) => {
    editMutation.mutate({ commentId, data: { content } });
  };

  const handleDelete = (commentId: string) => {
    deleteMutation.mutate(commentId);
  };

  const handleToggleResolve = () => {
    resolveMutation.mutate(thread.id);
  };

  return (
    <Card
      className={`mb-3 ${thread.is_resolved ? "opacity-60" : ""}`}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {thread.title || "Discussion"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={thread.is_resolved ? "secondary" : "default"}
              className="text-xs"
            >
              {thread.is_resolved ? "Resolu" : "Ouvert"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleResolve}
              disabled={resolveMutation.isPending}
              className="h-6 text-xs px-2"
            >
              {thread.is_resolved ? "Rouvrir" : "Resoudre"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {formatRelativeTime(thread.created_at)} - {thread.comments.length}{" "}
          commentaire{thread.comments.length > 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {/* Comments list */}
        <div className="flex flex-col">
          {thread.comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Reply section */}
        {!thread.is_resolved && (
          <div className="mt-2">
            {showReply ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Ecrire une reponse..."
                  className="text-sm min-h-[60px]"
                />
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReply(false);
                      setReplyContent("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={
                      !replyContent.trim() || replyMutation.isPending
                    }
                  >
                    {replyMutation.isPending ? "Envoi..." : "Repondre"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(true)}
                className="text-xs w-full"
              >
                Repondre
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommentsSidebar({
  resourceType,
  resourceId,
}: CommentsSidebarProps) {
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);

  const { data: threads, isLoading, error } = useCommentThreads(
    resourceType,
    resourceId
  );
  const createThreadMutation = useCreateThread(resourceType, resourceId);

  const handleCreateThread = () => {
    if (!newThreadContent.trim()) return;
    createThreadMutation.mutate(
      {
        title: newThreadTitle.trim() || undefined,
        content: newThreadContent.trim(),
      },
      {
        onSuccess: () => {
          setNewThreadContent("");
          setNewThreadTitle("");
          setShowNewThread(false);
        },
      }
    );
  };

  const openThreads = threads?.filter((t) => !t.is_resolved) || [];
  const resolvedThreads = threads?.filter((t) => t.is_resolved) || [];

  return (
    <div className="flex flex-col h-full w-80 border-l bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            Commentaires
            {threads && threads.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {threads.length}
              </Badge>
            )}
          </h3>
          <Button
            size="sm"
            onClick={() => setShowNewThread(!showNewThread)}
            className="h-7 text-xs"
          >
            + Nouveau
          </Button>
        </div>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <div className="px-4 py-3 border-b bg-white">
          <input
            type="text"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="Titre (optionnel)"
            className="w-full text-sm border rounded px-2 py-1 mb-2 outline-none focus:ring-1 focus:ring-blue-400"
          />
          <Textarea
            value={newThreadContent}
            onChange={(e) => setNewThreadContent(e.target.value)}
            placeholder="Ecrire un commentaire..."
            className="text-sm min-h-[80px] mb-2"
          />
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewThread(false);
                setNewThreadContent("");
                setNewThreadTitle("");
              }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreateThread}
              disabled={
                !newThreadContent.trim() || createThreadMutation.isPending
              }
            >
              {createThreadMutation.isPending ? "Envoi..." : "Publier"}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 py-3">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-8">
            Chargement...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center py-8">
            Erreur de chargement des commentaires.
          </p>
        )}

        {!isLoading && !error && threads?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Aucun commentaire</p>
            <p className="text-xs text-gray-300 mt-1">
              Demarrez une discussion en cliquant sur &quot;+ Nouveau&quot;
            </p>
          </div>
        )}

        {/* Open threads */}
        {openThreads.length > 0 && (
          <div className="mb-4">
            {openThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                resourceType={resourceType}
                resourceId={resourceId}
              />
            ))}
          </div>
        )}

        {/* Resolved threads */}
        {resolvedThreads.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
              Resolus ({resolvedThreads.length})
            </p>
            {resolvedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                resourceType={resourceType}
                resourceId={resourceId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
