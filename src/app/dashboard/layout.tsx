import { Sidebar, MobileSidebar } from '@/components/dashboard/sidebar'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import { SearchCommand } from '@/components/dashboard/search-command'
import { VerifyEmailBanner } from '@/components/dashboard/verify-email-banner'
import { Logo } from '@/components/ui/logo'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const showVerifyBanner = user && !user.emailVerified

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-40 hidden lg:flex h-14 items-center justify-end gap-2 border-b border-border glass px-6">
          <SearchCommand />
          <NotificationBell />
        </header>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border glass px-4 lg:hidden">
          <MobileSidebar />
          <Logo size="sm" />
          <div className="ms-auto flex items-center gap-1">
            <SearchCommand />
            <NotificationBell />
          </div>
        </header>
        {showVerifyBanner && (
          <div className="px-4 pt-4 lg:px-6 lg:pt-6">
            <VerifyEmailBanner />
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
