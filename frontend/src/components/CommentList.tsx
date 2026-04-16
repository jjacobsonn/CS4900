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

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="comment-list list-group mt-3">
      {sortedComments.map((comment) => (
        <li key={comment.id} className="comment-item list-group-item">
          <div className="comment-meta">
            <strong>{comment.author}</strong>{" "}
            <span className="comment-date" title={comment.createdAt}>
              {formatDateTime(comment.createdAt)}
            </span>
            {isAdmin && onDeleteComment && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm comment-delete-btn"
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


