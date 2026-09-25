import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Heart, Linkedin, MessageCircle, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { ConnectButton, type useMyConnections } from "@/components/tw/connect-button";
import { addComment, deletePost, displayName, ROLE_LABEL, timeAgo, toggleLike, type FeedPost } from "@/lib/social";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  me,
  net,
  onChange
}: {
  post: FeedPost;
  me: string;
  net: ReturnType<typeof useMyConnections>;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(post.likes.includes(me));
  const [likes, setLikes] = useState(post.likes.length);
  const a = post.author;

  const like = async () => {
    const was = liked;
    setLiked(!was);
    setLikes((n) => n + (was ? -1 : 1));
    try {
      await toggleLike(post.id, me, was);
    } catch (e) {
      setLiked(was);
      setLikes((n) => n + (was ? 1 : -1));
      toast.error((e as Error).message);
    }
  };

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await addComment(post.id, me, comment.trim());
      setComment("");
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(post.id);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyPostLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <article className="fade-up rounded-2xl border bg-card p-5 sm:p-6 shadow-xs hover:border-border/80 transition-colors">
      <header className="flex items-start gap-3.5">
        <Link to="/app/people/$id" params={{ id: post.author_id }}>
          <MemberAvatar m={a} size="md" className="ring-2 ring-background shadow-xs" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to="/app/people/$id"
              params={{ id: post.author_id }}
              className="font-display font-semibold text-sm hover:underline text-foreground"
            >
              {displayName(a)}
            </Link>
            <BadgeCheck className="h-3.5 w-3.5 text-gold shrink-0" />
            {post.linkedin_shared && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan bg-cyan/10 px-2 py-0.5 rounded-full">
                <Linkedin className="h-2.5 w-2.5" /> LinkedIn
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {a?.headline || ROLE_LABEL[a?.role ?? ""] || "Tourism Member"}
            {a?.organisation ? ` · ${a.organisation}` : ""}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/80 mt-0.5">
            {timeAgo(post.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {post.author_id === me ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete post"
              onClick={remove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <ConnectButton personId={post.author_id} name={displayName(a)} net={net} />
          )}
        </div>
      </header>

      {post.body && (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 font-normal">
          {post.body}
        </p>
      )}

      {post.image_url && (
        <div className="mt-4 overflow-hidden rounded-xl border">
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="max-h-[500px] w-full object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* Stats Bar */}
      {(likes > 0 || post.comments.length > 0) && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-b pb-2.5">
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px]">
              ❤️
            </span>
            {likes} {likes === 1 ? "like" : "likes"}
          </span>
          {post.comments.length > 0 && (
            <button
              onClick={() => setOpen(!open)}
              className="hover:underline hover:text-foreground transition-colors"
            >
              {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="mt-2 flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={like}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
            liked ? "text-gold hover:text-gold/90 bg-gold/10" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current text-gold")} />
          <span>{liked ? "Liked" : "Like"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
            open ? "text-cyan bg-cyan/10" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="mr-1.5 h-4 w-4" />
          <span>Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={copyPostLink}
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Comments Drawer */}
      {open && (
        <div className="mt-4 pt-3 border-t space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <MemberAvatar m={c.author} size="sm" className="mt-0.5 shrink-0" />
              <div className="flex-1 rounded-2xl bg-surface-2/60 px-3.5 py-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{displayName(c.author)}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm mt-1 text-foreground/90">{c.body}</p>
              </div>
            </div>
          ))}

          <form onSubmit={reply} className="flex gap-2 pt-1">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a constructive reply…"
              maxLength={1000}
              className="bg-surface rounded-xl text-xs h-9"
            />
            <Button size="sm" type="submit" disabled={!comment.trim()} className="rounded-xl h-9 px-4">
              Reply
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}
