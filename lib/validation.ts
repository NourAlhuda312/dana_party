import type { MessageVisibility } from "@/types/event";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,60}$/;
const VISIBILITIES: MessageVisibility[] = [
  "public_named",
  "public_anonymous",
  "private"
];

export interface ValidatedSubmission {
  eventId: string;
  name: string;
  message: string;
  visibility: MessageVisibility;
}

export function validateSubmission(input: unknown): ValidatedSubmission {
  if (!input || typeof input !== "object") {
    throw new Error("الطلب غير صالح.");
  }

  const body = input as Record<string, unknown>;
  const eventId = String(body.eventId ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const message = String(body.message ?? "").trim();
  const visibility = String(body.visibility ?? "") as MessageVisibility;

  if (!SLUG_PATTERN.test(eventId)) {
    throw new Error("رابط المناسبة غير صالح.");
  }

  if (name.length > 60) {
    throw new Error("الاسم لازم يكون أقصر من 60 حرف.");
  }

  if (message.length < 2 || message.length > 600) {
    throw new Error("التهنئة لازم تكون بين حرفين و600 حرف.");
  }

  if (!VISIBILITIES.includes(visibility)) {
    throw new Error("خيار الخصوصية غير صالح.");
  }

  return { eventId, name, message, visibility };
}
