"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";

import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  clientAuth
} from "@/lib/firebase-client";

interface AdminMessage {
  id: string;
  submittedName?: string | null;
  displayName: string;
  message: string;
  visibility: string;
  status: string;
  featured?: boolean;
  createdAt?: string | null;
}

interface AdminApiResponse {
  ok?: boolean;
  error?: string;
  messages?: AdminMessage[];
}

async function readAdminApiResponse(
  response: Response
): Promise<AdminApiResponse> {
  const rawResponse =
    await response.text();

  if (!rawResponse) {
    return {};
  }

  try {
    return JSON.parse(
      rawResponse
    ) as AdminApiResponse;
  } catch {
    console.error(
      "Admin API returned a non-JSON response:",
      {
        status: response.status,
        statusText: response.statusText,
        contentType:
          response.headers.get(
            "content-type"
          ),
        responsePreview:
          rawResponse.slice(0, 500)
      }
    );

    throw new Error(
      response.status >= 500
        ? "صار خطأ بالسيرفر."
        : "وصل رد غير متوقّع من السيرفر."
    );
  }
}

export default function AdminConsole() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eventId, setEventId] = useState("dana");
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(clientAuth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        if (nextUser) void loadMessages(nextUser, eventId);
      }),
    [eventId]
  );
interface AdminApiResponse {
  ok?: boolean;
  error?: string;
  messages?: AdminMessage[];
}

async function readAdminApiResponse(
  response: Response
): Promise<AdminApiResponse> {
  const rawResponse = await response.text();

  if (!rawResponse) {
    return {};
  }

  try {
    return JSON.parse(
      rawResponse
    ) as AdminApiResponse;
  } catch {
    console.error(
      "Admin API returned a non-JSON response:",
      {
        status: response.status,
        statusText: response.statusText,
        responsePreview:
          rawResponse.slice(0, 500)
      }
    );

    throw new Error(
      "وصل رد غير متوقّع من السيرفر."
    );
  }
}

  async function login(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    try {
      await signInWithEmailAndPassword(clientAuth, email, password);
    } catch {
      setFeedback("بيانات الدخول غير صحيحة أو الحساب مش مفعّل.");
    }
  }

async function loadMessages(
  currentUser = user,
  selectedEvent = eventId
) {
  if (!currentUser) {
    return;
  }

  setLoading(true);
  setFeedback("");

  try {
    const token =
      await currentUser.getIdToken();

    const response = await fetch(
      `/api/admin/messages?eventId=${encodeURIComponent(
        selectedEvent
      )}`,
      {
        headers: {
          authorization:
            `Bearer ${token}`
        }
      }
    );

    const result =
      await readAdminApiResponse(response);

    if (!response.ok) {
      throw new Error(
        result.error ??
          "تعذّر تحميل التهاني."
      );
    }

    setMessages(
      result.messages ?? []
    );
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : "تعذّر تحميل التهاني."
    );
  } finally {
    setLoading(false);
  }
}

async function action(
  messageId: string,
  command: string
) {
  if (!user) {
    return;
  }

  setFeedback("");

  try {
    const token =
      await user.getIdToken();

    const response = await fetch(
      "/api/admin/messages",
      {
        method: "POST",
        headers: {
          authorization:
            `Bearer ${token}`,
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          eventId,
          messageId,
          action: command
        })
      }
    );

    const result =
      await readAdminApiResponse(response);

    if (!response.ok) {
      throw new Error(
        result.error ??
          "تعذّر تنفيذ العملية."
      );
    }

    await loadMessages();
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : "تعذّر تنفيذ العملية."
    );
  }
}

  if (loading && !user) {
    return <main className="admin-shell">جاري التحميل…</main>;
  }

  if (!user) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={login}>
          <h1>إدارة تهاني دانة</h1>
          <p>هاي الصفحة للعائلة والمشرفين بس.</p>
          <label>
            البريد الإلكتروني
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            كلمة المرور
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary-button">دخول</button>
          {feedback && <p className="form-feedback error">{feedback}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p>{user.email}</p>
          <h1>لوحة إدارة التهاني</h1>
        </div>
        <button onClick={() => signOut(clientAuth)}>تسجيل خروج</button>
      </header>

      <div className="admin-toolbar">
        <label>
          رمز المناسبة
          <input
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          />
        </label>
        <button onClick={() => loadMessages()}>تحديث</button>
      </div>

      {feedback && <p className="form-feedback error">{feedback}</p>}
      {loading && <p>جاري تحميل التهاني…</p>}

      <div className="admin-list">
        {messages.map((item) => (
          <article key={item.id} className="admin-message">
            <div className="admin-message-meta">
              <strong>{item.submittedName || "بدون اسم"}</strong>
              <span>{item.visibility}</span>
              <span>{item.status}</span>
            </div>
            <p>{item.message}</p>
            <div className="admin-actions">
              {item.visibility !== "private" && item.status !== "published" && (
                <button onClick={() => action(item.id, "publish")}>
                  نشر
                </button>
              )}
              {item.status === "published" && (
                <button onClick={() => action(item.id, "hide")}>
                  إخفاء
                </button>
              )}
              {item.status === "published" && (
                <button
                  onClick={() =>
                    action(item.id, item.featured ? "unfeature" : "feature")
                  }
                >
                  {item.featured ? "إلغاء التثبيت" : "تثبيت"}
                </button>
              )}
              <button
                className="danger"
                onClick={() => action(item.id, "delete")}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
