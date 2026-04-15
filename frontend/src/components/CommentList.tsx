import { Comment } from "../types/models";
import { formatDate } from "../utils/format";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p>No comments yet.</p>;
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <li key={comment.id}>
          <div className="comment-meta">
            <strong>{comment.author}</strong> <span>{formatDate(comment.createdAt)}</span>
          </div>
          <p>{comment.message}</p>
        </li>
      ))}
    </ul>
  );
}
