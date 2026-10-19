'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Bot, Sparkles, Menu, CircleUser, LogOut } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        {/* Left side: Logo / Title */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <div className="bg-primary/10 rounded-lg p-2">
            <Sparkles className="text-primary h-5 w-5" />
          </div>
          <span className="tracking-tight">Ask My Notes</span>
        </Link>

        {/* Right side: Desktop Navigation */}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <Link href="/documents" passHref>
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()} flex items-center gap-2 ${
                      pathname === '/documents'
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : ''
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/chat" passHref>
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()} flex items-center gap-2 ${
                      pathname === '/chat' ? 'bg-accent text-accent-foreground font-semibold' : ''
                    }`}
                  >
                    <Bot className="text-primary h-4 w-4" />
                    <span>Ask Chatbot</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/chat" passHref>
                  <NavigationMenuLink
                    className={`${navigationMenuTriggerStyle()} flex items-center gap-2 ${
                      pathname === '/chat' ? 'bg-accent text-accent-foreground font-semibold' : ''
                    }`}
                  >
                    <LogOut className="text-primary h-4 w-4" />
                    <span>Logout</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side: Mobile Hamburger Menu */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger>
              <Button variant="outline" size="icon" className="cursor-pointer">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <CircleUser className="text-primary h-5 w-5" />
                  User name
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href="/documents"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/documents'
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </Link>

                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/chat'
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bot className="text-primary h-4 w-4" />
                  <span>Ask Chatbot</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/chat'
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogOut className="text-primary h-4 w-4" />
                  <span>Logout</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
