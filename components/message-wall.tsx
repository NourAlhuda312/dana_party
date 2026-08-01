"use client";

import type { PublicMessage } from "@/types/event";

interface MessageWallProps {
  messages: PublicMessage[];
}

export default function MessageWall({
  messages
}: MessageWallProps) {
  if (!messages.length) {
    return (
      <div
        className="empty-wall elegant-empty-wall"
        role="status"
      >
        <span
          className="empty-wall-icon"
          aria-hidden="true"
        >
          ✦
        </span>

        <div>
          <h3>لوح التهاني لسا بستنى أول كلمة</h3>

          <p>
            أول كلمة حلوة ممكن تكون منكم 🤍
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-wall-shell">
      <header className="message-wall-header">
        <div className="message-wall-header-title">
          <span
            className="message-wall-header-icon"
            aria-hidden="true"
          >
            ✦
          </span>

          <div>
            <strong>كلمات من القلب</strong>

            <small>
              كل بطاقة هون صارت جزء من ذكرى الفرحة
            </small>
          </div>
        </div>

        <span className="message-count-badge">
          {formatMessageCount(messages.length)}
        </span>
      </header>

      <div
        className="message-board greeting-message-board"
        role="list"
        aria-label="تهاني المعازيم"
      >
        {messages.map((item, index) => {
          const displayName =
            item.displayName?.trim() || "بدون اسم";

          const isAnonymous =
            displayName === "بدون اسم";

          const formattedDate =
            formatMessageDate(item.createdAt);

          return (
            <article
              className={[
                "message-card",
                "greeting-message-card",
                `message-card-variation-${index % 4}`,
                item.featured ? "featured" : ""
              ].join(" ")}
              key={item.id}
              role="listitem"
            >
              <div
                className="message-card-paper-border"
                aria-hidden="true"
              />

              <header className="message-card-top">
                <span
                  className="message-card-pin"
                  aria-hidden="true"
                >
                  {index % 2 === 0 ? "●" : "✦"}
                </span>

                {item.featured && (
                  <span className="featured-message-badge">
                    تهنئة مميّزة
                  </span>
                )}
              </header>

              <div className="message-card-content">
                <span
                  className="message-quote-mark"
                  aria-hidden="true"
                >
                  “
                </span>

                <blockquote dir="auto">
                  {item.message}
                </blockquote>

                <span
                  className="message-ending-ornament"
                  aria-hidden="true"
                >
                  ✦
                </span>
              </div>

              <footer className="message-card-footer">
                <div className="message-author">
                  <span
                    className={`message-author-icon ${
                      isAnonymous
                        ? "message-author-anonymous"
                        : ""
                    }`}
                    aria-hidden="true"
                  >
                    {isAnonymous ? "♡" : "✍"}
                  </span>

                  <div>
                    <span className="message-author-label">
                      {isAnonymous
                        ? "تهنئة بدون اسم"
                        : "من"}
                    </span>

                    <strong dir="auto">
                      {displayName}
                    </strong>
                  </div>
                </div>

                {formattedDate && (
                  <time className="message-date">
                    {formattedDate}
                  </time>
                )}
              </footer>
            </article>
          );
        })}
      </div>

      <footer className="message-wall-footer">
        <span aria-hidden="true">✦</span>

        <p>
          كلماتكم الحلوة بتضل محفوظة هون كذكرى
        </p>

        <span aria-hidden="true">✦</span>
      </footer>
    </div>
  );
}

function formatMessageDate(
  createdAt: PublicMessage["createdAt"]
) {
  if (!createdAt) {
    return "";
  }

  try {
    const date = createdAt.toDate();

    return new Intl.DateTimeFormat("ar-PS", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  } catch {
    return "";
  }
}

function formatMessageCount(count: number) {
  if (count === 1) {
    return "تهنئة وحدة";
  }

  if (count === 2) {
    return "تهنئتين";
  }

  return `${count} تهنئة`;
}