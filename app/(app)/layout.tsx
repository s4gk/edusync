import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SidebarProvider } from "@/components/sidebar-context";
import { CommandMenuProvider } from "@/components/command-menu";
import { ScheduleProvider } from "@/components/schedule-context";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <CommandMenuProvider>
        <ScheduleProvider>
        <div className="flex h-screen overflow-hidden bg-bg">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
          </div>
        </div>
        </ScheduleProvider>
      </CommandMenuProvider>
    </SidebarProvider>
  );
}
