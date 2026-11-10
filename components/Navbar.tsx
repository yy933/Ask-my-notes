'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Bot,
  Sparkles,
  Menu,
  CircleUser,
  LogOut,
  LogIn,
  Upload,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/ModeToggle';

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { user, userName, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.refresh();
      router.push('/login');
    });
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
          <div className="bg-primary/10 text-primary ring-primary/20 flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text tracking-tight text-transparent">
            Ask My Notes
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading && (
            <>
              {user ? (
                <>
                  <NavigationMenu>
                    <NavigationMenuList className="flex-row items-center gap-1">
                      {/* Upload Files */}
                      <NavigationMenuItem>
                        <Link href="/upload" legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              navigationMenuTriggerStyle(),
                              'flex shrink-0 flex-row items-center gap-2 px-3 whitespace-nowrap transition-colors',
                              pathname === '/upload'
                                ? 'bg-accent text-accent-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <Upload className="text-primary h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Upload Files</span>
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>

                      {/* Document List */}
                      <NavigationMenuItem>
                        <Link href="/documents" legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              navigationMenuTriggerStyle(),
                              'flex shrink-0 flex-row items-center gap-2 px-3 whitespace-nowrap transition-colors',
                              pathname === '/documents'
                                ? 'bg-accent text-accent-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Document List</span>
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>

                      {/* Ask Chatbot */}
                      <NavigationMenuItem>
                        <Link href="/chat" legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              navigationMenuTriggerStyle(),
                              'flex shrink-0 flex-row items-center gap-2 px-3 whitespace-nowrap transition-colors',
                              pathname === '/chat'
                                ? 'bg-accent text-accent-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <Bot className="text-primary h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Ask Chatbot</span>
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>

                  <div className="bg-border mx-1 h-5 w-[1px]" />
                  <ModeToggle />

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="text-muted-foreground hover:text-foreground cursor-pointer gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isPending ? 'Logging out...' : 'Logout'}</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Landing / Visitor State */}
                  <ModeToggle />
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="cursor-pointer gap-2 shadow-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'cursor-pointer shadow-none'
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[290px] flex-col sm:w-[320px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  {user ? (
                    <>
                      <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span className="truncate text-base font-semibold">
                        {userName || 'Logged in User'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CircleUser className="text-muted-foreground h-5 w-5" />
                      <span className="text-base font-semibold">Guest</span>
                    </>
                  )}
                </SheetTitle>
              </SheetHeader>

              {user ? (
                <>
                  <div className="mt-6 flex flex-1 flex-col gap-1.5">
                    <Link
                      href="/upload"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === '/upload'
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Upload className="text-primary h-4 w-4" />
                      <span>Upload Files</span>
                    </Link>

                    <Link
                      href="/documents"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === '/documents'
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Document List</span>
                    </Link>

                    <Link
                      href="/chat"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === '/chat'
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Bot className="text-primary h-4 w-4" />
                      <span>Ask Chatbot</span>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4">
                    <div className="flex items-center justify-between px-3 py-1">
                      <span className="text-muted-foreground text-xs font-medium">Theme Mode</span>
                      <ModeToggle />
                    </div>

                    <Button
                      variant="outline"
                      disabled={isPending}
                      className="text-destructive hover:bg-destructive/10 w-full cursor-pointer justify-start gap-3"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isPending ? 'Logging out...' : 'Logout'}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-6 flex flex-1 flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-3">
                        <LogIn className="h-4 w-4" />
                        <span>Login</span>
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full justify-start gap-3">
                        <Sparkles className="h-4 w-4" />
                        <span>Get Started Free</span>
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2 border-t pt-4">
                    <div className="flex items-center justify-between px-3 py-1">
                      <span className="text-muted-foreground text-xs font-medium">Theme Mode</span>
                      <ModeToggle />
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
