'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const segment = useSelectedLayoutSegment();
  const activeSegment = segment || 'evaluations';

  const NavItem = ({
    href,
    label,
    current,
  }: {
    href: string;
    label: string;
    current: string;
  }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        activeSegment === current ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {label}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-left">Eval Scheduler</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <NavItem
            href="/evaluations"
            label="Evaluations"
            current="evaluations"
          />
          <NavItem href="/requests" label="Requests" current="requests" />
          <NavItem href="/courses" label="Courses" current="courses" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
