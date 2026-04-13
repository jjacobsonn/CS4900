import { Comment } from "../types/models";
import { formatDateTime } from "../utils/format";

type Props = {
  comments: Comment[];
  isAdmin?: boolean;
  onDeleteComment?: (commentId: string) => void;
  deletingCommentId?: string | null;
};

export function CommentList({ comments, isAdmin, onDeleteComment, deletingCommentId }: Props) {
  if (comments.length === 0) {
    return <p>No comments yet.</p>;
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <li key={comment.id} className="comment-item">
          <div className="comment-meta">
            <strong>{comment.author}</strong>{" "}
            <span className="comment-date" title={comment.createdAt}>
              {formatDateTime(comment.createdAt)}
            </span>
            {isAdmin && onDeleteComment && (
              <button
                type="button"
                className="secondary-btn small comment-delete-btn"
                onClick={() => onDeleteComment(comment.id)}
                disabled={deletingCommentId === comment.id}
                aria-label={`Delete comment by ${comment.author}`}
              >
                {deletingCommentId === comment.id ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <p>{comment.message}</p>
        </li>
      ))}
    </ul>
  );
}
