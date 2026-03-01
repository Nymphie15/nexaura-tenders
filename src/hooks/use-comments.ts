import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "@/lib/api/endpoints";
import type {
  CreateCommentRequest,
  ReplyCommentRequest,
  EditCommentRequest,
} from "@/types/comments";

/**
 * Fetch all comment threads for a given resource.
 */
export function useCommentThreads(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  return useQuery({
    queryKey: ["comments", resourceType, resourceId],
    queryFn: () => commentsApi.listThreads(resourceType, resourceId),
    enabled: !!resourceType && !!resourceId,
  });
}

/**
 * Create a new comment thread with the first comment.
 */
export function useCreateThread(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      commentsApi.createThread(resourceType, resourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", resourceType, resourceId],
      });
    },
  });
}

/**
 * Reply to an existing thread.
 */
export function useReplyToThread(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      data,
    }: {
      threadId: string;
      data: ReplyCommentRequest;
    }) => commentsApi.replyToThread(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", resourceType, resourceId],
      });
    },
  });
}

/**
 * Edit an existing comment.
 */
export function useEditComment(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: EditCommentRequest;
    }) => commentsApi.editComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", resourceType, resourceId],
      });
    },
  });
}

/**
 * Delete a comment.
 */
export function useDeleteComment(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", resourceType, resourceId],
      });
    },
  });
}

/**
 * Toggle resolve/unresolve on a thread.
 */
export function useResolveThread(
  resourceType: "workflow" | "tender" | "decision",
  resourceId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => commentsApi.resolveThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", resourceType, resourceId],
      });
    },
  });
}
