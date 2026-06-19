import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FORUM_URL = "https://functions.poehali.dev/bed2061a-c7ec-4d7b-a472-b3aec13a758c";
const AUTH_URL = "https://functions.poehali.dev/0fdb3888-4048-481a-b03c-afd58fd284e5";

const CATEGORIES = ["Все", "Техника", "Тюнинг", "Путешествия", "Электрика", "Общее"];
const CAT_COLORS: Record<string, string> = {
  "Техника": "text-club-red", "Тюнинг": "text-blue-400",
  "Путешествия": "text-green-400", "Электрика": "text-yellow-400", "Общее": "text-club-chrome",
};

interface Topic {
  id: number; category: string; title: string;
  views: number; replies: number; created_at: string; author: string;
}

export default function Forum() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; nickname: string } | null>(null);

  const [ntTitle, setNtTitle] = useState("");
  const [ntBody, setNtBody] = useState("");
  const [ntCategory, setNtCategory] = useState("Общее");
  const [ntError, setNtError] = useState("");
  const [ntLoading, setNtLoading] = useState(false);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (sid) {
      fetch(`${AUTH_URL}?action=me`, { headers: { "X-Session-Id": sid } })
        .then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeCategory === "Все"
      ? `${FORUM_URL}?action=list`
      : `${FORUM_URL}?action=list&category=${encodeURIComponent(activeCategory)}`;
    fetch(url).then(r => r.json()).then(d => setTopics(d.topics || [])).finally(() => setLoading(false));
  }, [activeCategory]);

  const createTopic = async () => {
    if (!ntTitle.trim() || !ntBody.trim()) { setNtError("Заполните заголовок и текст"); return; }
    setNtError(""); setNtLoading(true);
    try {
      const sid = localStorage.getItem("session_id") || "";
      const r = await fetch(`${FORUM_URL}?action=create_topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sid },
        body: JSON.stringify({ title: ntTitle, body: ntBody, category: ntCategory }),
      });
      const d = await r.json();
      if (!r.ok) { setNtError(d.error || "Ошибка"); return; }
      navigate(`/forum/${d.id}`);
    } finally { setNtLoading(false); }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    return `${Math.floor(h / 24)} д. назад`;
  };

  return (
    <div className="min-h-screen bg-club-dark text-club-light font-body">
      {/* Header */}
      <div className="bg-club-steel border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-club-chrome hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={18} />
            <span className="font-display text-sm tracking-wider uppercase">На главную</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-club-red flex items-center justify-center rotate-45">
              <span className="text-white font-display font-bold text-[8px] -rotate-45">T</span>
            </div>
            <span className="font-display font-bold tracking-widest text-white text-sm">TOUAREG<span className="text-club-red">CLUB</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Title + new topic */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-club-red" />
              <span className="font-display text-club-red text-xs tracking-[0.4em] uppercase">Обсуждения</span>
            </div>
            <h1 className="font-display font-bold text-5xl text-white tracking-tight">ФОРУМ</h1>
          </div>
          <button
            onClick={() => currentUser ? setNewTopicOpen(true) : navigate("/")}
            className="font-display text-sm tracking-[0.2em] uppercase bg-club-red text-white px-6 py-3 hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Icon name="Plus" size={16} />
            Новая тема
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-display text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-all ${
                activeCategory === cat
                  ? "bg-club-red border-club-red text-white"
                  : "border-white/10 text-club-chrome hover:border-club-red/50 hover:text-white"
              }`}
            >{cat}</button>
          ))}
        </div>

        {/* Topics list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader" size={32} className="text-club-red animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20 text-club-chrome">
            <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-display tracking-wider">Тем пока нет. Будь первым!</p>
          </div>
        ) : (
          <div className="space-y-px">
            {topics.map(topic => (
              <div
                key={topic.id}
                onClick={() => navigate(`/forum/${topic.id}`)}
                className="bg-club-steel border border-white/5 hover:border-club-red/30 hover:bg-club-steel/80 p-5 flex items-center gap-4 cursor-pointer group transition-all duration-200"
              >
                <div className="w-10 h-10 bg-club-red/20 border border-club-red/30 flex items-center justify-center font-display font-bold text-club-red flex-shrink-0 text-sm">
                  {topic.author[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-display tracking-wider uppercase ${CAT_COLORS[topic.category] || "text-club-chrome"}`}>
                      {topic.category}
                    </span>
                  </div>
                  <div className="text-white group-hover:text-club-red transition-colors font-body truncate">{topic.title}</div>
                  <div className="text-club-chrome text-xs mt-1">{topic.author} · {timeAgo(topic.created_at)}</div>
                </div>
                <div className="hidden md:flex items-center gap-6 text-club-chrome text-sm flex-shrink-0">
                  <div className="text-center">
                    <div className="font-display text-white">{topic.replies}</div>
                    <div className="text-xs">ответов</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-white">{topic.views.toLocaleString()}</div>
                    <div className="text-xs">просмотров</div>
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-club-chrome group-hover:text-club-red transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New topic modal */}
      {newTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-club-dark/80 backdrop-blur-sm" onClick={() => setNewTopicOpen(false)} />
          <div className="relative bg-club-steel border border-white/10 w-full max-w-lg">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-club-red" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="font-display font-semibold text-white tracking-wider uppercase">Новая тема</div>
                <button onClick={() => setNewTopicOpen(false)} className="text-club-chrome hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Раздел</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c !== "Все").map(cat => (
                      <button
                        key={cat}
                        onClick={() => setNtCategory(cat)}
                        className={`font-display text-xs tracking-wider uppercase px-3 py-1.5 border transition-all ${
                          ntCategory === cat ? "bg-club-red border-club-red text-white" : "border-white/10 text-club-chrome hover:border-club-red/50"
                        }`}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Заголовок</label>
                  <input
                    type="text" value={ntTitle} onChange={e => setNtTitle(e.target.value)}
                    placeholder="Тема вашего вопроса или рассказа"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Текст</label>
                  <textarea
                    value={ntBody} onChange={e => setNtBody(e.target.value)}
                    placeholder="Подробно опишите вашу тему..."
                    rows={5}
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors resize-none font-body"
                  />
                </div>
                {ntError && <div className="text-club-red text-xs bg-club-red/10 border border-club-red/20 px-3 py-2">{ntError}</div>}
                <button
                  onClick={createTopic} disabled={ntLoading}
                  className="w-full bg-club-red hover:bg-red-700 disabled:opacity-60 text-white font-display text-sm tracking-[0.2em] uppercase py-4 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name={ntLoading ? "Loader" : "Send"} size={16} className={ntLoading ? "animate-spin" : ""} />
                  {ntLoading ? "Публикуем..." : "Опубликовать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
