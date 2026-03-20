import { Sidebar, MobileSidebar } from '@/components/dashboard/sidebar'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import { Logo } from '@/components/ui/logo'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-40 hidden lg:flex h-14 items-center justify-end border-b border-white/10 glass px-6">
          <NotificationBell />
        </header>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/10 glass px-4 lg:hidden">
          <MobileSidebar />
          <Logo size="sm" />
          <div className="mr-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
