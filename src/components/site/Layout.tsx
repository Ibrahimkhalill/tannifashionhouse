import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TrustStrip } from "./TrustStrip";
import { BottomNav } from "./BottomNav";

export function Layout({ children, hideTrust = false }: { children: ReactNode; hideTrust?: boolean }) {
  return (
    <>
      <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-background">
        <Header />
        <main className="min-w-0 w-full flex-1 overflow-x-clip pb-16 lg:pb-0">{children}</main>
        {!hideTrust && <TrustStrip />}
        <Footer />
      </div>
      <BottomNav />
    </>
  );
}
