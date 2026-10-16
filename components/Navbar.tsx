'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Bot, Sparkles } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        {/* Left side: Logo / Title */}
        <div className="flex items-center gap-2 text-lg font-bold">
          <div className="bg-primary/10 rounded-lg p-2">
            <Sparkles className="text-primary h-5 w-5" />
          </div>
          <span className="tracking-tight">Ask My Notes</span>
        </div>

        {/* Right side: Navigation Menu  */}
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            {/* Document list btn */}
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

            {/* Chatbot btn */}
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
      </div>
    </header>
  );
}
