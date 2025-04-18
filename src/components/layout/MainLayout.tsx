import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const { isLoggedIn, user, logout } = useAuth();

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {isLoggedIn && (
        <Sidebar />
      )}
      <div className="flex-1 flex flex-col">
        {isLoggedIn && (
          <header className="h-16 border-b flex items-center justify-between px-4 bg-background">
            <h1 className="text-xl font-semibold">Kalimaya Storage</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-2 ml-4">
                <div className="hidden md:flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  <span>{user?.username}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
