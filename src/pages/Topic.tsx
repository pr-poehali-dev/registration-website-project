import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FORUM_URL = "https://functions.poehali.dev/bed2061a-c7ec-4d7b-a472-b3aec13a758c";
const AUTH_URL = "https://functions.poehali.dev/0fdb3888-4048-481a-b03c-afd58fd284e5";

const CAT_COLORS: Record<string, string> = {
  "Техника": "text-club-red", "Тюнинг": "text-blue-400",
  "Путешествия": "text-green-400", "Электрика": "text-yellow-400", "Общее": "text-club-chrome",
};

interface Reply { id: number; body: string; author: string; created_at: string; }
interface Topic { id: number; category: string; title: string; body: string; views: number; replies: number; created_at: string; author: string; }

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: number; nickname: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (sid) {
      fetch(`${AUTH_URL}?action=me`, { headers: { "X-Session-Id": sid } })
        .then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${FORUM_URL}?action=get&id=${id}`)
      .then(r => r.json())
      .then(d => { setTopic(d.topic); setReplies(d.replies || []); })
      .finally(() => setLoading(false));
  }, [id]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setReplyError(""); setReplyLoading(true);
    try {
      const sid = localStorage.getItem("session_id") || "";
      const r = await fetch(`${FORUM_URL}?action=create_reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sid },
        body: JSON.stringify({ topic_id: Number(id), body: replyText }),
      });
      const d = await r.json();
      if (!r.ok) { setReplyError(d.error || "Ошибка"); return; }
      setReplies(prev => [...prev, d]);
      setReplyText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally { setReplyLoading(false); }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "только что";
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "long" });
  };

  if (loading) return (
    <div className="min-h-screen bg-club-dark flex items-center justify-center">
      <Icon name="Loader" size={40} className="text-club-red animate-spin" />
    </div>
  );

  if (!topic) return (
    <div className="min-h-screen bg-club-dark flex flex-col items-center justify-center gap-4 text-club-chrome">
      <Icon name="AlertCircle" size={48} className="opacity-30" />
      <p className="font-display tracking-wider">Тема не найдена</p>
      <button onClick={() => navigate("/forum")} className="text-club-red font-display text-sm tracking-wider uppercase hover:underline">← Вернуться на форум</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-club-dark text-club-light font-body">
      {/* Header */}
      <div className="bg-club-steel border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/forum")} className="flex items-center gap-2 text-club-chrome hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={18} />
            <span className="font-display text-sm tracking-wider uppercase hidden sm:inline">Форум</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 bg-club-red flex items-center justify-center rotate-45 flex-shrink-0">
              <span className="text-white font-display font-bold text-[7px] -rotate-45">T</span>
            </div>
            <span className="font-display font-bold tracking-widest text-white text-sm truncate">TOUAREG<span className="text-club-red">CLUB</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Topic */}
        <div className="bg-club-steel border border-white/10 mb-4">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-club-red" />
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className={`font-display text-xs tracking-[0.3em] uppercase ${CAT_COLORS[topic.category] || "text-club-chrome"}`}>
                {topic.category}
              </span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-club-chrome text-xs">{topic.views} просмотров</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight mb-6 leading-tight">{topic.title}</h1>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
              <div className="w-10 h-10 bg-club-red/20 border border-club-red/30 flex items-center justify-center font-display font-bold text-club-red flex-shrink-0">
                {topic.author[0].toUpperCase()}
              </div>
              <div>
                <div className="font-display text-sm text-white tracking-wider">{topic.author}</div>
                <div className="text-club-chrome text-xs">{timeAgo(topic.created_at)}</div>
              </div>
            </div>

            <div className="text-club-light leading-relaxed whitespace-pre-wrap">{topic.body}</div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-px mb-4">
            {replies.map((reply, i) => (
              <div key={reply.id} className="bg-club-steel/60 border border-white/5 p-5 md:p-6 flex gap-4">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-9 h-9 bg-club-steel border border-white/10 flex items-center justify-center font-display font-bold text-club-chrome text-sm">
                    {reply.author[0].toUpperCase()}
                  </div>
                  <div className="text-club-chrome/30 font-display text-xs">#{i + 1}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-display text-sm text-white tracking-wider">{reply.author}</span>
                    <span className="text-club-chrome/40 text-xs">{timeAgo(reply.created_at)}</span>
                  </div>
                  <div className="text-club-light leading-relaxed whitespace-pre-wrap text-sm">{reply.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />

        {/* Reply form */}
        <div className="bg-club-steel border border-white/10 mt-6">
          <div className="px-6 pt-5 pb-2 border-b border-white/5 flex items-center gap-2">
            <Icon name="MessageSquare" size={14} className="text-club-red" />
            <span className="font-display text-xs tracking-[0.3em] uppercase text-white">
              {replies.length > 0 ? `${replies.length} ответов` : "Ответить"}
            </span>
          </div>
          <div className="p-5">
            {currentUser ? (
              <>
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 bg-club-red flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0">
                    {currentUser.nickname[0].toUpperCase()}
                  </div>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }}
                    placeholder="Напишите ответ... (Ctrl+Enter для отправки)"
                    rows={4}
                    className="flex-1 bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors resize-none font-body"
                  />
                </div>
                {replyError && <div className="text-club-red text-xs bg-club-red/10 border border-club-red/20 px-3 py-2 mt-3">{replyError}</div>}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={sendReply} disabled={replyLoading || !replyText.trim()}
                    className="font-display text-sm tracking-[0.2em] uppercase bg-club-red hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 transition-all flex items-center gap-2"
                  >
                    <Icon name={replyLoading ? "Loader" : "Send"} size={14} className={replyLoading ? "animate-spin" : ""} />
                    {replyLoading ? "Отправляем..." : "Ответить"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-club-chrome text-sm mb-4">Войдите, чтобы написать ответ</p>
                <button
                  onClick={() => navigate("/")}
                  className="font-display text-sm tracking-[0.2em] uppercase bg-club-red text-white px-6 py-3 hover:bg-red-700 transition-colors"
                >
                  Войти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
