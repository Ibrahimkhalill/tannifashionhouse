"use client";

import { ProfileShell } from "@/components/site/ProfileShell";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <ProfileShell>
      <div className="animate-fade-up">
        <div className="bg-white rounded-2xl border py-16 text-center">
          <div className="mx-auto size-16 rounded-full bg-secondary flex items-center justify-center mb-5">
            <Bell className="size-7 text-muted-foreground/70" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-base">No Notifications</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {"You're all caught up! We'll notify you about orders and offers."}
          </p>
        </div>
      </div>
    </ProfileShell>
  );
}
