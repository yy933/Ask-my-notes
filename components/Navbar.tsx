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
import { ModeToggle } from '@/components/ModeToggle';

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

        {/* Desktop Navigation (for desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {/* main menu */}
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
            </NavigationMenuList>
          </NavigationMenu>

          {/*  Section separator (Theme & Logout) */}
          <div className="bg-border mx-1 h-5 w-[1px]" />

          <ModeToggle />

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground cursor-pointer gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Mobile Hamburger Menu (for mobile) */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger>
              <Button variant="outline" size="icon" className="cursor-pointer">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[280px] flex-col sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <CircleUser className="text-primary h-5 w-5" />
                  User Name
                </SheetTitle>
              </SheetHeader>

              {/* Main menu */}
              <div className="mt-6 flex flex-1 flex-col gap-1">
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
              </div>

              {/* Tools */}
              <div className="flex flex-col gap-2 border-t pt-4">
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-muted-foreground text-xs font-medium">Theme Mode</span>
                  <ModeToggle />
                </div>

                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 w-full cursor-pointer justify-start gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
