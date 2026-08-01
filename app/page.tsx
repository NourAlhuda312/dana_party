import { redirect } from "next/navigation";

export default function HomePage() {
  redirect(`/${process.env.DEFAULT_EVENT_SLUG ?? "dana"}`);
}
