"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";

import { clientDb } from "@/lib/firebase-client";
import type { EventConfig, PublicMessage } from "@/types/event";

import MessageForm from "@/components/message-form";
import MessageWall from "@/components/message-wall";
import MusicPlayer from "@/components/music-player";

export default function EventExperience({ slug }: { slug: string }) {
  const [event, setEvent] = useState<EventConfig | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const eventRef = doc(clientDb, "events", slug);

    const unsubscribeEvent = onSnapshot(
      eventRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("المناسبة مش موجودة أو الرابط غير صحيح.");
          setLoading(false);
          return;
        }

        const data = snapshot.data() as EventConfig;

        if (!data.isPublished) {
          setError("المناسبة مش منشورة حاليًا.");
          setLoading(false);
          return;
        }

        setEvent({
          ...data,
          slug: snapshot.id
        });

        setLoading(false);
      },
      (firebaseError) => {
        console.error("Failed to load event:", firebaseError);
        setError("صار خطأ وإحنا بنحمّل المناسبة.");
        setLoading(false);
      }
    );

    const messagesQuery = query(
      collection(clientDb, "events", slug, "publicMessages"),
      orderBy("createdAt", "desc"),
      limit(60)
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((messageDocument) => ({
            id: messageDocument.id,
            ...(messageDocument.data() as Omit<PublicMessage, "id">)
          }))
        );
      },
      (firebaseError) => {
        console.error("Failed to load messages:", firebaseError);
      }
    );

    return () => {
      unsubscribeEvent();
      unsubscribeMessages();
    };
  }, [slug]);

  const themeStyle = useMemo(
    () =>
      event
        ? ({
            "--navy": event.theme.navy,
            "--baby-blue": event.theme.babyBlue,
            "--white": event.theme.white,
            "--ink": event.theme.ink,
            "--paper": event.theme.paper
          } as CSSProperties)
        : undefined,
    [event]
  );

  function celebrate() {
    setConfetti(true);

    window.setTimeout(() => {
      setConfetti(false);
    }, 2600);
  }

  function closeIntro() {
    setIntroOpen(false);

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }, 150);
  }

  if (loading) {
    return (
      <main className="state-screen greeting-state-screen">
        <div className="state-card">
          <GraduationCapIcon />
          <p>ثواني وبنفتح بطاقة الفرحة…</p>
          <span className="loading-ornament" aria-hidden="true">
            ✦
          </span>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="state-screen greeting-state-screen">
        <div className="state-card state-card-error">
          <span className="state-card-symbol" aria-hidden="true">
            ✦
          </span>

          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="event-shell electronic-card-site"
      style={themeStyle}
      data-card-theme="botanical"
    >
      {introOpen && (
        <section
          className="intro-screen greeting-intro-screen"
          aria-label="بطاقة الترحيب"
        >
          <div className="intro-background-decoration" aria-hidden="true">
            <span className="floating-star floating-star-one">✦</span>
            <span className="floating-star floating-star-two">✧</span>
            <span className="floating-star floating-star-three">⋆</span>
          </div>

          <article className="greeting-card intro-greeting-card">
            <BotanicalCorner position="top-right" />
            <BotanicalCorner position="top-left" />
            <BotanicalCorner position="bottom-right" />
            <BotanicalCorner position="bottom-left" />

            <div className="greeting-card-inner">
              <div className="intro-cap">
                <GraduationCapIcon />
              </div>

              <p className="intro-eyebrow">
                {event.introEyebrow}
              </p>

              <p className="intro-celebration-label">
                أهلًا فيكم بفرحة
              </p>

              <h1 className="intro-event-name">
                {event.name}
              </h1>

              <CardDivider />

        
              <p className="intro-event-subtitle">
                {event.introSubtitle}
              </p>

       <button
  type="button"
  className="primary-button greeting-open-button"
  onClick={closeIntro}
  aria-label={`فتح بطاقة ${event.name}`}
>
  <span className="greeting-open-button-text">
    افتحوا بطاقة {event.name}
  </span>

  <span
    className="greeting-open-button-arrow"
    aria-hidden="true"
  >
    ←
  </span>
</button>
            </div>
          </article>

          <p className="intro-helper-text">
            كلمة منكم اليوم، بتضل معها ذكرى بكرا
          </p>
        </section>
      )}

      {confetti && <Confetti />}

      <div className="site-decoration" aria-hidden="true">
        <span className="site-decoration-star star-one">✦</span>
        <span className="site-decoration-star star-two">✧</span>
        <span className="site-decoration-star star-three">⋆</span>
      </div>

      <header className="hero section greeting-hero">
        <article className="greeting-card main-celebration-card">
          <BotanicalCorner position="top-right" />
          <BotanicalCorner position="top-left" />
          <BotanicalCorner position="bottom-right" />
          <BotanicalCorner position="bottom-left" />

          <div className="hero-card-toolbar">
            <div
              className="hero-cap-badge"
              aria-label="قبعة تخرج"
            >
              <GraduationCapIcon />
            </div>

            <MusicPlayer src={event.musicUrl} />
          </div>

          <div className="hero-card-content">
            <p className="eyebrow">
              من تعب الأيام لفرحة اليوم
            </p>

            <h1 className="hero-title">
              <span className="hero-title-small">
                مبارك يا
              </span>

              <strong className="hero-name">
                {event.name}
              </strong>
            </h1>

            <CardDivider />

            <p className="hero-copy">
              {event.achievementText}
            </p>

            <div className="achievement-card elegant-achievement-card">
              <div className="achievement-person">
                <span className="achievement-label">
                  صاحبة الفرحة
                </span>

                <strong>
                  {event.name}
                </strong>

                {event.branch && (
                  <span className="achievement-branch">
                    {event.branch}
                  </span>
                )}
              </div>

              {typeof event.score === "number" && (
                <div className="achievement-score">
                  <span className="achievement-score-label">
                    المعدّل
                  </span>

                  <strong>
                    {event.score}
                    <small>%</small>
                  </strong>
                </div>
              )}
            </div>

            <a
              className="hero-scroll-link"
              href="#write-message"
            >
              <span>اتركوا كلمة حلوة لدانة</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </article>
      </header>

      <section
        className="section form-section card-page-section"
        id="write-message"
      >
        <article className="content-greeting-card form-greeting-card">
          <CornerLeaves />

          <div className="section-heading card-section-heading">
            <span className="section-kicker">
              رسالة بتضل ذكرى
            </span>

            <h2>
              {event.formTitle}
            </h2>

            <CardDivider compact />

            <p className="section-description">
              اكتبوا إلها كلمة من القلب، وخلوها جزء من ذكرى هاليوم.
            </p>
          </div>

       <MessageForm
  eventId={event.slug}
  eventName={event.name}
  eventOpen={event.isOpen}
  onSuccess={celebrate}
/>
        </article>
      </section>

      <section
        className="section wall-section card-page-section"
        id="messages-wall"
      >
        <article className="content-greeting-card wall-greeting-card">
          <CornerLeaves />

          <div className="section-heading card-section-heading">
            <span className="section-kicker">
              من القلب للقلب
            </span>

            <h2>
              {event.wallTitle}
            </h2>

            <CardDivider compact />

            <p className="section-description">
              كلمات حلوة من ناس فرحانين بنجاح دانة.
            </p>
          </div>

          <MessageWall messages={messages} />
        </article>
      </section>

      <footer className="greeting-footer">
        <div className="footer-ornament" aria-hidden="true">
          <span />
          <GraduationCapIcon />
          <span />
        </div>

        <p>
          {event.qrText}
        </p>

        <small>
          معمولة بمحبة عشان تضل هالفرحة ذكرى
        </small>
      </footer>
    </main>
  );
}

function CardDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`card-divider ${
        compact ? "card-divider-compact" : ""
      }`}
      aria-hidden="true"
    >
      <span className="divider-line" />
      <span className="divider-flower">✦</span>
      <span className="divider-line" />
    </div>
  );
}

function BotanicalCorner({
  position
}: {
  position:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
}) {
  return (
    <svg
      className={`botanical-corner botanical-${position}`}
      viewBox="0 0 220 220"
      aria-hidden="true"
      focusable="false"
    >
      <g className="botanical-stems">
        <path d="M18 12C58 54 84 96 100 154" />
        <path d="M38 9C74 42 113 79 150 130" />
        <path d="M7 54C55 70 95 95 132 144" />
      </g>

      <g className="botanical-leaves">
        <ellipse cx="47" cy="43" rx="10" ry="24" transform="rotate(-43 47 43)" />
        <ellipse cx="72" cy="68" rx="9" ry="21" transform="rotate(-37 72 68)" />
        <ellipse cx="92" cy="96" rx="9" ry="21" transform="rotate(-29 92 96)" />
        <ellipse cx="113" cy="67" rx="9" ry="22" transform="rotate(-48 113 67)" />
        <ellipse cx="137" cy="93" rx="9" ry="21" transform="rotate(-40 137 93)" />
        <ellipse cx="45" cy="92" rx="8" ry="20" transform="rotate(-66 45 92)" />
        <ellipse cx="73" cy="111" rx="8" ry="19" transform="rotate(-58 73 111)" />
      </g>

      <g className="botanical-flower botanical-flower-large">
        <circle cx="28" cy="28" r="18" />
        <circle cx="15" cy="29" r="11" />
        <circle cx="27" cy="15" r="11" />
        <circle cx="41" cy="27" r="11" />
        <circle cx="29" cy="42" r="11" />
        <circle className="botanical-flower-center" cx="28" cy="28" r="6" />
      </g>

      <g className="botanical-flower botanical-flower-small">
        <circle cx="92" cy="45" r="11" />
        <circle cx="82" cy="47" r="7" />
        <circle cx="91" cy="36" r="7" />
        <circle cx="102" cy="46" r="7" />
        <circle cx="92" cy="56" r="7" />
        <circle className="botanical-flower-center" cx="92" cy="46" r="4" />
      </g>

      <g className="botanical-berries">
        <circle cx="140" cy="121" r="5" />
        <circle cx="153" cy="132" r="4" />
        <circle cx="130" cy="137" r="4" />
        <circle cx="145" cy="148" r="5" />
      </g>
    </svg>
  );
}

function CornerLeaves() {
  return (
    <div className="content-card-corner-leaves" aria-hidden="true">
      <svg viewBox="0 0 150 150">
        <path d="M10 12C41 43 65 78 83 136" />
        <ellipse
          cx="32"
          cy="43"
          rx="8"
          ry="19"
          transform="rotate(-42 32 43)"
        />
        <ellipse
          cx="54"
          cy="69"
          rx="8"
          ry="18"
          transform="rotate(-35 54 69)"
        />
        <ellipse
          cx="70"
          cy="99"
          rx="8"
          ry="18"
          transform="rotate(-26 70 99)"
        />
        <circle cx="18" cy="21" r="9" />
        <circle cx="30" cy="18" r="7" />
        <circle cx="25" cy="31" r="7" />
      </svg>
    </div>
  );
}

function GraduationCapIcon() {
  return (
    <svg
      className="graduation-cap-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 24L32 11L59 24L32 37L5 24Z" />
      <path d="M16 31V43C16 48 23 53 32 53C41 53 48 48 48 43V31" />
      <path d="M59 24V42" />
      <circle cx="59" cy="46" r="3" />
    </svg>
  );
}

function Confetti() {
  return (
    <div className="confetti elegant-confetti" aria-hidden="true">
      {Array.from({ length: 32 }, (_, index) => (
        <i
          key={index}
          className={`confetti-piece confetti-piece-${index % 4}`}
          style={{
            left: `${(index * 37) % 100}%`,
            animationDelay: `${(index % 8) * 0.08}s`,
            transform: `rotate(${index * 23}deg)`
          }}
        />
      ))}
    </div>
  );
}