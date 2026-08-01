"use client";

import {
  FormEvent,
  useId,
  useRef,
  useState
} from "react";

import type { MessageVisibility } from "@/types/event";

interface Props {
  eventId: string;
  eventName: string;
  eventOpen: boolean;
  onSuccess: () => void;
}

type FormStatus =
  | "idle"
  | "sending"
  | "success"
  | "error";

interface ApiResponse {
  ok?: boolean;
  message?: string;
  error?: string;
}

export default function MessageForm({
  eventId,
  eventName,
  eventOpen,
  onSuccess
}: Props) {
  const nameInputId = useId();
  const messageInputId = useId();
  const visibilityGroupId = useId();

  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [visibility, setVisibility] =
    useState<MessageVisibility>("public_named");

  const [status, setStatus] =
    useState<FormStatus>("idle");

  const [feedback, setFeedback] = useState("");

  const isSending = status === "sending";
  const messageLength = message.length;
  const remainingCharacters = 600 - messageLength;

  const nameHint = getNameHint(visibility, eventName);

  async function submit(
    submitEvent: FormEvent<HTMLFormElement>
  ) {
    submitEvent.preventDefault();

    if (isSending) {
      return;
    }

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (cleanMessage.length < 2) {
      showFeedback(
        "error",
        "اكتبوا كلمة أطول شوي قبل الإرسال."
      );

      return;
    }

    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          eventId,
          name: cleanName,
          message: cleanMessage,
          visibility
        })
      });

   const contentType =
  response.headers.get("content-type") ?? "";

let result: {
  ok?: boolean;
  message?: string;
  error?: string;
} = {};

if (
  contentType.includes(
    "application/json"
  )
) {
  result = (await response.json()) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };
} else {
  const serverResponse =
    await response.text();

  console.error(
    "The messages API returned a non-JSON response:",
    {
      status: response.status,
      statusText: response.statusText,
      response: serverResponse
    }
  );

  throw new Error(
    response.status >= 500
      ? "صار خطأ بالسيرفر وإحنا بنحفظ التهنئة."
      : "وصل رد غير متوقّع من السيرفر."
  );
}

if (!response.ok) {
  throw new Error(
    result.error ??
      "ما قدرنا نحفظ التهنئة."
  );
}

      const isPrivateMessage =
        visibility === "private";

      setName("");
      setMessage("");
      setVisibility("public_named");

      showFeedback(
        "success",
        isPrivateMessage
          ? `وصلت رسالتك الخاصة لـ${eventName}، وما رح تظهر على لوح التهاني 🤍`
          : `وصلت كلمتك لـ${eventName}، وشكرًا إنك شاركتنا الفرحة 🤍`
      );

      onSuccess();

      if (!isPrivateMessage) {
        window.setTimeout(() => {
          document
            .getElementById("messages-wall")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
        }, 1300);
      }
    } catch (error) {
      showFeedback(
        "error",
        error instanceof Error
          ? error.message
          : "صار خطأ غير متوقّع. جرّبوا مرة ثانية."
      );
    }
  }

  function showFeedback(
    nextStatus: Extract<FormStatus, "success" | "error">,
    text: string
  ) {
    setStatus(nextStatus);
    setFeedback(text);

    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }, 100);
  }

  if (!eventOpen) {
    return (
      <section
        className="closed-note closed-message-card"
        aria-label="استقبال التهاني مغلق"
      >
        <div
          className="closed-note-icon"
          aria-hidden="true"
        >
          ✦
        </div>

        <div>
          <h3>استقبال التهاني مسكّر حاليًا</h3>

          <p>
            الكلمات الحلوة الموجودة بتضل محفوظة
            كذكرى لـ{eventName}.
          </p>
        </div>
      </section>
    );
  }

  return (
    <form
      className="message-form greeting-message-form"
      onSubmit={submit}
      noValidate
    >
      <header className="message-form-header">
        <span aria-hidden="true">✦</span>

        <p>
          الاسم اختياري، وإنت بتختار مين بقدر
          يشوف رسالتك.
        </p>

        <span aria-hidden="true">✦</span>
      </header>

      <div className="form-field">
        <label htmlFor={nameInputId}>
          <span className="field-title-row">
            <span>اسمك</span>

            <span className="optional-badge">
              اختياري
            </span>
          </span>
        </label>

        <input
          id={nameInputId}
          name="senderName"
          type="text"
          dir="auto"
          value={name}
          maxLength={60}
          autoComplete="name"
          disabled={isSending}
          aria-describedby={`${nameInputId}-hint`}
          onChange={(inputEvent) => {
            setName(inputEvent.target.value);

            if (status !== "idle") {
              setStatus("idle");
              setFeedback("");
            }
          }}
          placeholder="مثلاً: خالتك سمر"
        />

        <p
          id={`${nameInputId}-hint`}
          className="field-hint"
        >
          {nameHint}
        </p>
      </div>

      <div className="form-field">
        <label htmlFor={messageInputId}>
          <span className="field-title-row">
            <span>كلمتك لـ{eventName}</span>

            <span className="required-badge">
              مطلوب
            </span>
          </span>
        </label>

        <textarea
          id={messageInputId}
          name="message"
          dir="auto"
          required
          minLength={2}
          maxLength={600}
          value={message}
          disabled={isSending}
          aria-describedby={`${messageInputId}-hint ${messageInputId}-counter`}
          onChange={(textareaEvent) => {
            setMessage(textareaEvent.target.value);

            if (status !== "idle") {
              setStatus("idle");
              setFeedback("");
            }
          }}
          placeholder={`اكتبوا لـ${eventName} كلمة من القلب…`}
          rows={7}
        />

        <div className="textarea-meta">
          <span
            id={`${messageInputId}-hint`}
            className="field-hint"
          >
            اكتبوا براحتكم، بس خلّوا الرسالة بحدود
            600 حرف.
          </span>

          <span
            id={`${messageInputId}-counter`}
            className={`character-counter ${
              remainingCharacters <= 50
                ? "character-counter-warning"
                : ""
            }`}
            aria-live="polite"
          >
            {messageLength}/600
          </span>
        </div>
      </div>

      <fieldset
        className="visibility-fieldset"
        disabled={isSending}
        aria-describedby={`${visibilityGroupId}-description`}
      >
        <legend>
          مين بقدر يشوف التهنئة؟
        </legend>

        <p
          id={`${visibilityGroupId}-description`}
          className="visibility-description"
        >
          اختاروا طريقة ظهور الرسالة بعد الإرسال.
        </p>

        <div className="visibility-grid">
          <VisibilityOption
            value="public_named"
            checked={visibility === "public_named"}
            onChange={() =>
              setVisibility("public_named")
            }
            icon="✍"
            title="تظهر مع اسمي"
            note="الرسالة والاسم بيظهروا على لوح التهاني."
          />

          <VisibilityOption
            value="public_anonymous"
            checked={
              visibility === "public_anonymous"
            }
            onChange={() =>
              setVisibility("public_anonymous")
            }
            icon="◌"
            title="تظهر بدون اسمي"
            note="الرسالة بتظهر، بس الاسم بيضل مخفي."
          />

          <VisibilityOption
            value="private"
            checked={visibility === "private"}
            onChange={() =>
              setVisibility("private")
            }
            icon="✉"
            title={`خاصة لـ${eventName}`}
            note="الرسالة ما بتظهر للمعازيم."
          />
        </div>
      </fieldset>

      <button
        type="submit"
        className="primary-button submit-button"
        disabled={
          isSending ||
          message.trim().length < 2
        }
      >
        <span
          className={`submit-button-icon ${
            isSending ? "is-loading" : ""
          }`}
          aria-hidden="true"
        >
          {isSending ? "✦" : "♡"}
        </span>

        <span>
          {isSending
            ? "بنحفظ كلمتك…"
            : `ابعث تهنئتك لـ${eventName}`}
        </span>
      </button>

      {feedback && (
        <div
          ref={feedbackRef}
          className={`form-feedback ${status}`}
          role={status === "error" ? "alert" : "status"}
          aria-live={
            status === "error"
              ? "assertive"
              : "polite"
          }
        >
          <span
            className="form-feedback-icon"
            aria-hidden="true"
          >
            {status === "success" ? "✓" : "!"}
          </span>

          <p>{feedback}</p>
        </div>
      )}
    </form>
  );
}

function VisibilityOption({
  value,
  checked,
  onChange,
  icon,
  title,
  note
}: {
  value: MessageVisibility;
  checked: boolean;
  onChange: () => void;
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <label
      className={`visibility-option ${
        checked ? "selected" : ""
      }`}
    >
      <input
        type="radio"
        name="visibility"
        value={value}
        checked={checked}
        onChange={onChange}
      />

      <span
        className="visibility-option-icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="visibility-option-content">
        <strong>{title}</strong>
        <small>{note}</small>
      </span>

      <span
        className="visibility-option-check"
        aria-hidden="true"
      >
        {checked ? "✓" : ""}
      </span>
    </label>
  );
}

function getNameHint(
  visibility: MessageVisibility,
  eventName: string
) {
  if (visibility === "public_anonymous") {
    return "حتى لو كتبت اسمك، ما رح يظهر على لوح التهاني.";
  }

  if (visibility === "private") {
    return `الاسم رح يكون ظاهر لـ${eventName} والإدارة فقط.`;
  }

  return "إذا تركت الاسم فاضي، الرسالة رح تظهر بدون اسم.";
}