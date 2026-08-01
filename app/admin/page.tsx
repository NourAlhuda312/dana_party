import type { Metadata } from "next";

import AdminConsole from "@/components/admin-console";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "إدارة التهاني"
};

export default function AdminPage() {
  return <AdminConsole />;
}