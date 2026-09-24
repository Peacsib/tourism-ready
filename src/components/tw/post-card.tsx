import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Linkedin, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/tw/member-avatar";
import { ConnectButton, type useMyConnections } from "@/components/tw/connect-button";
import { addComment, deletePost, displayName, ROLE_LABEL, timeAgo, toggleLike, type FeedPost } from "@/lib/social";
import { cn } from "@/lib/utils";

export function PostCard({ post, me, net, onChange }: { post: FeedPost; me: string; net: ReturnType<typeof useMyConnections>; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(post.likes.includes(me));
  const [likes, setLikes] = useState(post.likes.length);
  const a = post.author;

  const like = async () => {
    const was = liked;
    setLiked(!was); setLikes((n) => n + (was ? -1 : 1));
    try { await toggleLike(post.id, me, was); } catch (e) { setLiked(was); setLikes((n) => n + (was ? 1 : -1)); toast.error((e as Error).message); }
  };
  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try { await addComment(post.id, me, comment.trim()); setComment(""); onChange(); } catch (err) { toast.error((err as Error).message); }
  };
  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    try { await deletePost(post.id); onChange(); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <article className="fade-up rounded-2xl border bg-card p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <Link to="/app/people/$id" params={{ id: post.author_id }}><MemberAvatar m={a} /></Link>
        <div className="min-w-0 flex-1">
          <Link to="/app/people/$id" params={{ id: post.author_id }} className="block truncate text-sm font-semibold hover:underline">{displayName(a)}</Link>
          <p className="truncate text-xs text-muted-foreground">{a?.headline || ROLE_LABEL[a?.role ?? ""] || "Member"}{a?.organisation ? ` · ${a.organisation}` : ""}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{timeAgo(post.created_at)}{post.linkedin_shared && <span className="flex items-center gap-1 text-cyan"><Linkedin className="h-3 w-3" /> Also on LinkedIn</span>}</p>
        </div>
        {post.author_id === me
          ? <Button variant="ghost" size="icon" aria-label="Delete post" onClick={remove}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
          : <ConnectButton personId={post.author_id} name={displayName(a)} net={net} />}
      </header>
      {post.body && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>}
      {post.image_url && <img src={post.image_url} alt="" loading="lazy" className="mt-4 max-h-[480px] w-full rounded-xl border object-cover" />}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{likes > 0 ? `${likes} ${likes === 1 ? "like" : "likes"}` : ""}</span>
        <button onClick={() => setOpen(!open)} className="hover:underline">{post.comments.length > 0 ? `${post.comments.length} comment${post.comments.length === 1 ? "" : "s"}` : ""}</button>
      </div>
      <div className="mt-2 grid grid-cols-2 border-t pt-1">
        <Button variant="ghost" size="sm" onClick={like} className={cn(liked && "text-gold")}><Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} /> Like</Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}><MessageCircle className="mr-1.5 h-4 w-4" /> Comment</Button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <MemberAvatar m={c.author} size="sm" />
              <div className="flex-1 rounded-xl bg-surface-2/60 px-3 py-2">
                <p className="text-xs font-semibold">{displayName(c.author)} <span className="font-normal text-muted-foreground">· {timeAgo(c.created_at)}</span></p>
                <p className="text-sm">{c.body}</p>
              </div>
            </div>
          ))}
          <form onSubmit={reply} className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" maxLength={1000} className="bg-surface" />
            <Button size="sm" type="submit" disabled={!comment.trim()}>Post</Button>
          </form>
        </div>
      )}
    </article>
  );
}
