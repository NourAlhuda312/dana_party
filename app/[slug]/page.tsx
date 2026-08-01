import EventExperience from "@/components/event-experience";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  return <EventExperience slug={slug} />;
}
