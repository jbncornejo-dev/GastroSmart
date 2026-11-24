import React from "react";
import { getCurrentSession } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  return <AppShell initialSession={session}>{children}</AppShell>;
}
