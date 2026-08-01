import type { Timestamp } from "firebase/firestore";

export type MessageVisibility =
  | "public_named"
  | "public_anonymous"
  | "private";

export interface EventTheme {
  navy: string;
  babyBlue: string;
  white: string;
  ink: string;
  paper: string;
}

export interface EventConfig {
  slug: string;
  name: string;
  score?: number;
  branch?: string;
  introEyebrow: string;
  introTitle: string;
  introSubtitle: string;
  achievementText: string;
  formTitle: string;
  wallTitle: string;
  qrText: string;
  musicUrl?: string;
  isOpen: boolean;
  isPublished: boolean;
  theme: EventTheme;
}

export interface PublicMessage {
  id: string;
  displayName: string;
  message: string;
  createdAt?: Timestamp;
  featured?: boolean;
}
