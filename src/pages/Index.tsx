import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/4a502ab0-d6cf-44a4-add6-71504e66624d/files/a00cd263-627e-49cb-802c-d2f3ea88c331.jpg";
const OFFROAD_IMG = "https://cdn.poehali.dev/projects/4a502ab0-d6cf-44a4-add6-71504e66624d/files/461e6042-a461-461d-9d63-166f621111fb.jpg";

const NAV_ITEMS = ["Главная", "Форум", "Галерея", "События", "Модели", "О клубе", "Контакты"];

const FORUM_POSTS = [
  { id: 1, author: "Алексей_T4", avatar: "А", time: "2 мин", category: "Техника", title: "Замена ТНВД на 3.0 TDI — подводные камни", replies: 34, views: 1240, hot: true },
  { id: 2, author: "MoscowTouareg", avatar: "М", time: "15 мин", category: "Тюнинг", title: "Лифт 40мм + AT резина — фотоотчёт", replies: 67, views: 3800, hot: true },
  { id: 3, author: "Snowrider_NK", avatar: "С", time: "1 час", category: "Путешествия", title: "Кольский полуостров за выходные — маршрут", replies: 22, views: 890, hot: false },
  { id: 4, author: "VW_Enthusiast", avatar: "V", time: "3 часа", category: "Электрика", title: "Кодирование скрытых функций через VCDS", replies: 89, views: 5600, hot: false },
];

const MODELS = [
  { gen: "I поколение", years: "2002–2010", engine: "3.2 V6 / 5.0 V10", desc: "Легенда, с которой всё началось. Мощная рама, пневмоподвеска.", color: "#E8001C" },
  { gen: "II поколение", years: "2010–2018", engine: "3.0 TDI / 4.2 FSI", desc: "Рестайлинг платформы. Новый уровень комфорта и технологий.", color: "#3A7BD5" },
  { gen: "III поколение", years: "2018–н.в.", engine: "3.0 TDI / PHEV", desc: "Цифровой кокпит, IQ.Drive, гибридная установка.", color: "#00C853" },
];

const EVENTS = [
  { date: "14 ИЮНЯ", title: "Слёт Touareg Club — Подмосковье", location: "Можайское водохранилище", participants: 48 },
  { date: "5 ИЮЛЯ", title: "Офроуд-марафон «Карпатский»", location: "Карпаты, Украина → Польша", participants: 23 },
  { date: "20 ИЮЛЯ", title: "Техдень: диагностика и настройка", location: "Москва, ТЦ «Авторевю»", participants: 15 },
];

const GALLERY_ITEMS = [
  { id: 1, src: OFFROAD_IMG, author: "Snowrider_NK", likes: 234, title: "Кольский полуостров" },
  { id: 2, src: HERO_IMG, author: "MoscowTouareg", likes: 189, title: "Ночной заезд" },
  { id: 3, src: OFFROAD_IMG, author: "Алексей_T4", likes: 312, title: "Горный перевал" },
  { id: 4, src: HERO_IMG, author: "VW_Enthusiast", likes: 156, title: "Дорога домой" },
  { id: 5, src: OFFROAD_IMG, author: "TouaregRider", likes: 278, title: "Бездорожье" },
  { id: 6, src: HERO_IMG, author: "NightDriver", likes: 421, title: "В движении" },
];

const CHAT_MESSAGES_INIT = [
  { id: 1, user: "Алексей_T4", avatar: "А", text: "Всем привет! Кто едет на слёт в июне?", time: "14:32" },
  { id: 2, user: "MoscowTouareg", avatar: "М", text: "Я однозначно! Уже записался 🚙", time: "14:35" },
  { id: 3, user: "Snowrider_NK", avatar: "С", text: "Буду, везу свой на новой резине после лифта", time: "14:41" },
  { id: 4, user: "VW_Enthusiast", avatar: "V", text: "Кто знает — парковка там большая? Нас будет 50+ машин", time: "14:44" },
  { id: 5, user: "TouaregPro", avatar: "Т", text: "Там поле 3 гектара, поместятся все 😄", time: "14:47" },
];

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-px bg-club-red" />
        <span className="font-display text-club-red text-xs tracking-[0.4em] uppercase">{sub}</span>
      </div>
      <h2 className="font-display font-bold text-5xl md:text-6xl text-white tracking-tight">{title}</h2>
    </div>
  );
}

const AUTH_URL = "https://functions.poehali.dev/0fdb3888-4048-481a-b03c-afd58fd284e5";

export default function Index() {
  const [activeSection, setActiveSection] = useState("Главная");
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState(CHAT_MESSAGES_INIT);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCar, setRegCar] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<{id: number; nickname: string; email: string; car: string} | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (sid) {
      fetch(`${AUTH_URL}?action=me`, { headers: { "X-Session-Id": sid } })
        .then(r => r.json())
        .then(data => { if (data.user) setCurrentUser(data.user); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const doLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setLoginError(data.error || "Ошибка входа"); return; }
      localStorage.setItem("session_id", data.session_id);
      setCurrentUser(data.user);
      setLoginOpen(false);
      setLoginEmail(""); setLoginPassword("");
    } finally {
      setLoginLoading(false);
    }
  };

  const doRegister = async () => {
    setRegError("");
    setRegLoading(true);
    try {
      const r = await fetch(`${AUTH_URL}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: regName, email: regEmail, password: regPassword, car: regCar }),
      });
      const data = await r.json();
      if (!r.ok) { setRegError(data.error || "Ошибка регистрации"); return; }
      localStorage.setItem("session_id", data.session_id);
      setCurrentUser(data.user);
      setRegisterOpen(false);
      setRegName(""); setRegEmail(""); setRegPassword(""); setRegCar("");
    } finally {
      setRegLoading(false);
    }
  };

  const doLogout = async () => {
    const sid = localStorage.getItem("session_id");
    if (sid) await fetch(`${AUTH_URL}?action=logout`, { method: "POST", headers: { "X-Session-Id": sid } });
    localStorage.removeItem("session_id");
    setCurrentUser(null);
  };

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      user: "Вы",
      avatar: "Я",
      text: chatMsg,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
    }]);
    setChatMsg("");
  };

  const scrollTo = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    const id = section.toLowerCase();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-club-dark text-club-light font-body overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-club-dark/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-club-red flex items-center justify-center rotate-45">
              <span className="text-white font-display font-bold text-xs -rotate-45">T</span>
            </div>
            <span className="font-display font-bold text-xl tracking-widest text-white">
              TOUAREG<span className="text-club-red">CLUB</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => scrollTo(item)}
                className={`px-3 py-2 font-display text-sm tracking-wider uppercase transition-all duration-200 ${
                  activeSection === item
                    ? "text-club-red border-b-2 border-club-red"
                    : "text-club-chrome hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-club-red flex items-center justify-center font-display font-bold text-white text-xs">
                    {currentUser.nickname[0].toUpperCase()}
                  </div>
                  <span className="font-display text-sm tracking-wider text-white uppercase">{currentUser.nickname}</span>
                </div>
                <button onClick={doLogout} className="font-display text-xs tracking-wider text-club-chrome hover:text-club-red transition-colors uppercase">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setLoginOpen(true)} className="font-display text-sm tracking-wider text-club-chrome hover:text-white transition-colors uppercase">
                  Войти
                </button>
                <button onClick={() => setRegisterOpen(true)} className="font-display text-sm tracking-wider bg-club-red text-white px-4 py-2 uppercase hover:bg-red-700 transition-colors">
                  Вступить
                </button>
              </>
            )}
          </div>

          <button className="lg:hidden text-club-chrome" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-club-steel border-t border-white/5 px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => scrollTo(item)}
                className="text-left font-display text-sm tracking-wider uppercase py-2 text-club-chrome hover:text-club-red transition-colors"
              >
                {item}
              </button>
            ))}
            <div className="flex gap-3 mt-3 pt-3 border-t border-white/10">
              <button onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }} className="flex-1 font-display text-sm tracking-wider text-club-chrome border border-club-chrome/30 py-2 uppercase">Войти</button>
              <button onClick={() => { setRegisterOpen(true); setMobileMenuOpen(false); }} className="flex-1 font-display text-sm tracking-wider bg-club-red text-white py-2 uppercase">Вступить</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="главная" className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-club-dark via-club-dark/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-club-dark via-transparent to-transparent" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-club-red to-transparent origin-left animate-speed-line"
              style={{ top: `${20 + i * 12}%`, left: 0, right: 0, animationDelay: `${i * 0.3}s`, opacity: 0.35 - i * 0.04 }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
          <div className="max-w-2xl">
            <div className="opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-club-red" />
                <span className="font-display text-club-red text-sm tracking-[0.4em] uppercase">Клуб владельцев</span>
              </div>
              <h1 className="font-display font-bold text-7xl md:text-8xl leading-none tracking-tight text-white mb-2">
                TOUAREG
              </h1>
              <h2 className="font-display font-light text-4xl md:text-5xl tracking-[0.15em] text-club-chrome mb-8">
                CLUB
              </h2>
            </div>

            <p className="opacity-0 animate-fade-in-delay text-club-chrome text-lg leading-relaxed mb-10 max-w-lg" style={{ animationFillMode: "forwards" }}>
              Сообщество тех, кто выбрал лучший внедорожник.
              Форум, галерея, события и живой чат — всё для владельцев Touareg.
            </p>

            <div className="opacity-0 animate-fade-in-delay2 flex flex-wrap gap-4" style={{ animationFillMode: "forwards" }}>
              <button
                onClick={() => scrollTo("Форум")}
                className="font-display text-sm tracking-[0.2em] uppercase bg-club-red text-white px-8 py-4 hover:bg-red-700 transition-all duration-200 hover:scale-105 flex items-center gap-3"
              >
                <Icon name="MessageSquare" size={16} />
                Войти в форум
              </button>
              <button
                onClick={() => scrollTo("О клубе")}
                className="font-display text-sm tracking-[0.2em] uppercase border border-white/30 text-white px-8 py-4 hover:border-club-red hover:text-club-red transition-all duration-200 flex items-center gap-3"
              >
                <Icon name="Users" size={16} />
                О клубе
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm">
              {[
                { num: "4 200+", label: "Участников" },
                { num: "120К+", label: "Сообщений" },
                { num: "15 лет", label: "Вместе" },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="font-display font-bold text-2xl text-white">{stat.num}</div>
                  <div className="font-body text-xs text-club-chrome uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Icon name="ChevronDown" size={24} className="text-club-chrome" />
        </div>
      </section>

      {/* FORUM */}
      <section id="форум" className="py-24 bg-club-steel relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-club-red via-club-red/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="ФОРУМ" sub="Обсуждения, советы, истории" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {["Техника", "Тюнинг", "Путешествия", "Электрика"].map((cat, i) => (
              <button key={cat} className="bg-club-dark/60 border border-white/5 hover:border-club-red/50 p-4 text-left transition-all duration-200 group">
                <div className={`w-2 h-2 rounded-full mb-3 ${i === 0 ? "bg-club-red" : "bg-club-chrome"} group-hover:bg-club-red transition-colors`} />
                <div className="font-display tracking-wider text-white text-sm uppercase">{cat}</div>
                <div className="text-club-chrome text-xs mt-1">{[234, 189, 87, 312][i]} тем</div>
              </button>
            ))}
          </div>

          <div className="space-y-px">
            {FORUM_POSTS.map((post, i) => (
              <div
                key={post.id}
                className="bg-club-dark/40 border border-white/5 hover:border-club-red/30 hover:bg-club-dark/60 p-5 flex items-center gap-5 transition-all duration-200 cursor-pointer group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-club-red/20 border border-club-red/30 flex items-center justify-center font-display font-bold text-club-red flex-shrink-0">
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-display tracking-wider uppercase text-club-red">{post.category}</span>
                    {post.hot && <span className="text-xs bg-club-red/20 text-club-red px-2 py-0.5 font-display tracking-wider">HOT</span>}
                  </div>
                  <div className="font-body text-white group-hover:text-club-red transition-colors truncate">{post.title}</div>
                  <div className="text-club-chrome text-xs mt-1">{post.author} · {post.time} назад</div>
                </div>
                <div className="hidden md:flex items-center gap-6 text-club-chrome text-sm flex-shrink-0">
                  <div className="text-center">
                    <div className="font-display text-white">{post.replies}</div>
                    <div className="text-xs">ответов</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-white">{post.views.toLocaleString()}</div>
                    <div className="text-xs">просмотров</div>
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-club-chrome group-hover:text-club-red transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button className="font-display text-sm tracking-[0.2em] uppercase border border-white/20 text-club-chrome px-8 py-3 hover:border-club-red hover:text-club-red transition-all duration-200">
              Все темы форума
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="галерея" className="py-24 bg-club-dark relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="ГАЛЕРЕЯ" sub="Фото участников клуба" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={item.id}
                className={`relative overflow-hidden group cursor-pointer ${i === 0 ? "col-span-2" : ""}`}
                style={{ aspectRatio: i === 0 ? "16/9" : "4/3" }}
              >
                <img src={item.src} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-club-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="font-display text-white text-sm tracking-wider">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Icon name="Heart" size={12} className="text-club-red" />
                    <span className="text-club-chrome text-xs">{item.likes} · {item.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <button className="font-display text-sm tracking-[0.2em] uppercase border border-white/20 text-club-chrome px-8 py-3 hover:border-club-red hover:text-club-red transition-all duration-200 flex items-center gap-3">
              <Icon name="Camera" size={16} />
              Добавить фото
            </button>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="события" className="py-24 bg-club-steel relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-club-red/50 to-club-red" />
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="СОБЫТИЯ" sub="Встречи, слёты, техдни" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVENTS.map((event, i) => (
              <div key={i} className="border border-white/10 hover:border-club-red/50 p-6 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-club-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="font-display font-bold text-4xl text-club-red mb-1 tracking-wider">{event.date}</div>
                <div className="font-display text-white text-lg tracking-wide mb-3 leading-tight">{event.title}</div>
                <div className="flex items-center gap-2 text-club-chrome text-sm mb-2">
                  <Icon name="MapPin" size={14} />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-club-chrome text-sm">
                  <Icon name="Users" size={14} />
                  {event.participants} участников
                </div>
                <button className="mt-5 w-full font-display text-xs tracking-[0.2em] uppercase text-white bg-transparent border border-club-red/30 py-2 group-hover:bg-club-red group-hover:border-club-red transition-all duration-300">
                  Записаться
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section id="модели" className="py-24 bg-club-dark relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="МОДЕЛИ" sub="Все поколения Touareg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {MODELS.map((model, i) => (
              <div key={i} className="relative bg-club-steel overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: model.color }} />
                <div className="p-8">
                  <div className="font-display font-bold text-5xl mb-1 select-none" style={{ color: model.color, opacity: 0.12 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-display font-bold text-xl text-white tracking-wider mb-1">{model.gen}</div>
                  <div className="font-display text-sm tracking-widest mb-4" style={{ color: model.color }}>{model.years}</div>
                  <div className="text-club-chrome text-sm leading-relaxed mb-4">{model.desc}</div>
                  <div className="flex items-center gap-2 text-xs font-display tracking-wider uppercase" style={{ color: model.color }}>
                    <Icon name="Zap" size={12} />
                    {model.engine}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="о клубе" className="py-24 bg-club-steel relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none select-none">
          <div className="font-display font-bold text-[20rem] leading-none text-white opacity-[0.03]">T</div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader title="О КЛУБЕ" sub="Наша история и ценности" />
              <p className="text-club-chrome leading-relaxed mb-6">
                Touareg Club основан в 2009 году и объединяет владельцев самого харизматичного внедорожника Volkswagen.
                За 15 лет мы провели сотни встреч, слётов и экспедиций — от Подмосковья до Памира.
              </p>
              <p className="text-club-chrome leading-relaxed mb-8">
                Клуб — это не просто форум. Это живое сообщество, где каждый помогает друг другу с техникой,
                маршрутами и хорошим настроением.
              </p>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { icon: "Trophy", label: "Основан в 2009" },
                  { icon: "Globe", label: "12 регионов" },
                  { icon: "Shield", label: "Проверенные участники" },
                  { icon: "Star", label: "Рейтинг 4.9 / 5" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-club-red/20 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} fallback="Star" size={16} className="text-club-red" />
                    </div>
                    <span className="text-white text-sm font-display tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img src={OFFROAD_IMG} alt="Touareg Club" className="w-full aspect-video object-cover" />
              <div className="absolute -bottom-4 -left-4 bg-club-red p-5">
                <div className="font-display font-bold text-4xl text-white">15</div>
                <div className="font-display text-white text-xs tracking-[0.3em] uppercase">лет вместе</div>
              </div>
              <div className="absolute -top-4 -right-4 border border-white/10 bg-club-dark p-4">
                <div className="font-display font-bold text-2xl text-white">4 200+</div>
                <div className="font-display text-club-chrome text-xs tracking-[0.3em] uppercase">участников</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAT */}
      <section id="чат" className="py-24 bg-club-dark relative">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader title="ЧАТ" sub="Общение в реальном времени" />
          <div className="border border-white/10 overflow-hidden">
            <div className="bg-club-steel px-5 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-club-red" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <span className="font-display text-sm tracking-wider text-white uppercase">Общий чат</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-club-chrome text-xs">47 онлайн</span>
              </div>
            </div>

            <div className="h-72 overflow-y-auto px-5 py-4 space-y-4 bg-club-dark/60">
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.user === "Вы" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-display font-bold text-xs ${msg.user === "Вы" ? "bg-club-red text-white" : "bg-club-steel border border-white/10 text-club-chrome"}`}>
                    {msg.avatar}
                  </div>
                  <div className={`max-w-xs flex flex-col ${msg.user === "Вы" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-display text-xs tracking-wider ${msg.user === "Вы" ? "text-club-red" : "text-club-chrome"}`}>{msg.user}</span>
                      <span className="text-white/20 text-xs">{msg.time}</span>
                    </div>
                    <div className={`px-4 py-2 text-sm ${msg.user === "Вы" ? "bg-club-red/20 border border-club-red/30 text-white" : "bg-club-steel border border-white/5 text-club-light"}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-white/10 flex bg-club-steel">
              <input
                type="text"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Написать сообщение..."
                className="flex-1 bg-transparent px-5 py-4 text-white text-sm placeholder-club-chrome/50 outline-none font-body"
              />
              <button onClick={sendMessage} className="bg-club-red hover:bg-red-700 transition-colors px-5 py-4 flex items-center justify-center">
                <Icon name="Send" size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="контакты" className="py-24 bg-club-steel relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-club-red via-club-red/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="КОНТАКТЫ" sub="Свяжитесь с нами" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              {[
                { icon: "Mail", label: "Email", value: "info@touareg-club.ru" },
                { icon: "MessageCircle", label: "Telegram", value: "@touareg_club" },
                { icon: "Globe", label: "VK Группа", value: "vk.com/touareg_club" },
                { icon: "MapPin", label: "Москва", value: "Встречи каждую пятницу" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-12 h-12 bg-club-dark border border-white/10 group-hover:border-club-red/50 flex items-center justify-center transition-colors duration-200">
                    <Icon name={item.icon} fallback="Mail" size={18} className="text-club-chrome group-hover:text-club-red transition-colors" />
                  </div>
                  <div>
                    <div className="font-display text-xs tracking-[0.3em] uppercase text-club-chrome mb-0.5">{item.label}</div>
                    <div className="text-white group-hover:text-club-red transition-colors">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-white/10 p-8">
              <div className="font-display font-semibold text-lg tracking-wider text-white mb-6 uppercase">Написать нам</div>
              <div className="space-y-4">
                <input type="text" placeholder="Ваше имя" className="w-full bg-club-dark border border-white/10 focus:border-club-red/50 px-4 py-3 text-white text-sm placeholder-club-chrome/50 outline-none transition-colors font-body" />
                <input type="email" placeholder="Email" className="w-full bg-club-dark border border-white/10 focus:border-club-red/50 px-4 py-3 text-white text-sm placeholder-club-chrome/50 outline-none transition-colors font-body" />
                <textarea placeholder="Сообщение" rows={4} className="w-full bg-club-dark border border-white/10 focus:border-club-red/50 px-4 py-3 text-white text-sm placeholder-club-chrome/50 outline-none transition-colors resize-none font-body" />
                <button className="w-full bg-club-red hover:bg-red-700 text-white font-display text-sm tracking-[0.2em] uppercase py-4 transition-all duration-200 hover:scale-[1.02]">
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-club-dark border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-club-red flex items-center justify-center rotate-45">
              <span className="text-white font-display font-bold text-xs -rotate-45">T</span>
            </div>
            <span className="font-display text-sm tracking-widest text-white">TOUAREG<span className="text-club-red">CLUB</span></span>
          </div>
          <div className="text-club-chrome text-xs font-body">© 2009–2026 Touareg Club Russia. Все права защищены.</div>
          <div className="flex gap-4">
            {["Правила", "Конфиденциальность", "Помощь"].map(link => (
              <button key={link} className="text-club-chrome hover:text-club-red text-xs font-display tracking-wider uppercase transition-colors">
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false); }}
        >
          <div className="absolute inset-0 bg-club-dark/80 backdrop-blur-sm" onClick={() => setLoginOpen(false)} />
          <div className="relative bg-club-steel border border-white/10 w-full max-w-sm animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-club-red" />

            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-club-red flex items-center justify-center rotate-45">
                      <span className="text-white font-display font-bold text-[8px] -rotate-45">T</span>
                    </div>
                    <span className="font-display font-bold text-sm tracking-widest text-white">TOUAREG<span className="text-club-red">CLUB</span></span>
                  </div>
                  <div className="font-display text-xs tracking-[0.3em] text-club-chrome uppercase mt-2">Вход в аккаунт</div>
                </div>
                <button onClick={() => setLoginOpen(false)} className="text-club-chrome hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Пароль</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                    onKeyDown={e => e.key === "Enter" && doLogin()}
                  />
                </div>

                {loginError && (
                  <div className="text-club-red text-xs font-body bg-club-red/10 border border-club-red/20 px-3 py-2">{loginError}</div>
                )}

                <button
                  onClick={doLogin}
                  disabled={loginLoading}
                  className="w-full bg-club-red hover:bg-red-700 disabled:opacity-60 text-white font-display text-sm tracking-[0.2em] uppercase py-4 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Icon name={loginLoading ? "Loader" : "LogIn"} size={16} className={loginLoading ? "animate-spin" : ""} />
                  {loginLoading ? "Входим..." : "Войти"}
                </button>

                <div className="text-center pt-2">
                  <span className="text-club-chrome text-xs">Ещё нет аккаунта? </span>
                  <button onClick={() => { setLoginOpen(false); setRegisterOpen(true); }} className="font-display text-xs tracking-wider text-club-red hover:text-red-400 transition-colors uppercase">
                    Вступить в клуб
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {registerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-club-dark/80 backdrop-blur-sm" onClick={() => setRegisterOpen(false)} />
          <div className="relative bg-club-steel border border-white/10 w-full max-w-sm animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-club-red" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-club-red flex items-center justify-center rotate-45">
                      <span className="text-white font-display font-bold text-[8px] -rotate-45">T</span>
                    </div>
                    <span className="font-display font-bold text-sm tracking-widest text-white">TOUAREG<span className="text-club-red">CLUB</span></span>
                  </div>
                  <div className="font-display text-xs tracking-[0.3em] text-club-chrome uppercase mt-2">Вступить в клуб</div>
                </div>
                <button onClick={() => setRegisterOpen(false)} className="text-club-chrome hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Имя / Никнейм</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Алексей_T4"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Пароль</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-[0.25em] uppercase text-club-chrome block mb-2">Ваш Touareg</label>
                  <input
                    type="text"
                    value={regCar}
                    onChange={e => setRegCar(e.target.value)}
                    placeholder="Touareg 3.0 TDI 2015"
                    className="w-full bg-club-dark border border-white/10 focus:border-club-red/60 px-4 py-3 text-white text-sm placeholder-club-chrome/40 outline-none transition-colors font-body"
                  />
                </div>

                {regError && (
                  <div className="text-club-red text-xs font-body bg-club-red/10 border border-club-red/20 px-3 py-2">{regError}</div>
                )}

                <button
                  onClick={doRegister}
                  disabled={regLoading}
                  className="w-full bg-club-red hover:bg-red-700 disabled:opacity-60 text-white font-display text-sm tracking-[0.2em] uppercase py-4 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Icon name={regLoading ? "Loader" : "UserPlus"} size={16} className={regLoading ? "animate-spin" : ""} />
                  {regLoading ? "Регистрируем..." : "Вступить в клуб"}
                </button>

                <div className="text-center pt-2">
                  <span className="text-club-chrome text-xs">Уже есть аккаунт? </span>
                  <button onClick={() => { setRegisterOpen(false); setLoginOpen(true); }} className="font-display text-xs tracking-wider text-club-red hover:text-red-400 transition-colors uppercase">
                    Войти
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}