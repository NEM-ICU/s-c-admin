import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type AppLayoutProps = {
  userEmail?: string | null;
  onSignOut: () => void;
  children: ReactNode;
};

export default function AppLayout({
  userEmail,
  onSignOut,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar userEmail={userEmail} onSignOut={onSignOut} />
      <main className="min-w-0 flex-1 p-5 md:p-9">{children}</main>
    </div>
  );
}
