'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GitBranch,
  CheckCircle2,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  activeColor?: string;
}

interface MobileNavProps {
  items?: NavItem[];
  className?: string;
}

// ============================================
// Spring Animations
// ============================================

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// Default Nav Items (5 tabs selon specs)
// ============================================

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    activeColor: 'from-blue-500 to-blue-600',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    href: '/workflows',
    icon: GitBranch,
    activeColor: 'from-violet-500 to-purple-600',
  },
  {
    id: 'hitl',
    label: 'HITL',
    href: '/hitl',
    icon: CheckCircle2,
    activeColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/tenders',
    icon: FileText,
    activeColor: 'from-emerald-500 to-green-600',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    activeColor: 'from-slate-500 to-slate-600',
  },
];

// ============================================
// Nav Item Component
// ============================================

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  index: number;
}

function NavItemButton({ item, isActive, index }: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="flex-1 relative">
      <motion.div
        className={cn(
          'relative flex flex-col items-center justify-center py-2 px-2',
          'transition-colors duration-200'
        )}
        whileTap={{ scale: 0.9 }}
        transition={springConfig}
      >
        {/* Active Background Indicator with layoutId for smooth transition */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="mobileNavActiveIndicator"
              className={cn(
                'absolute inset-x-1 -top-1 h-14 rounded-2xl',
                'bg-gradient-to-br opacity-15',
                item.activeColor || 'from-primary to-primary/80'
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springConfig}
            />
          )}
        </AnimatePresence>

        {/* Active Top Indicator Line */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="mobileNavTopLine"
              className={cn(
                'absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full',
                'bg-gradient-to-r',
                item.activeColor || 'from-primary to-primary/80'
              )}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={springConfig}
            />
          )}
        </AnimatePresence>

        {/* Icon Container */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: isActive ? 1.1 : 1,
            y: isActive ? -2 : 0,
          }}
          transition={springConfig}
        >
          <Icon
            className={cn(
              'w-5 h-5 transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          
          {/* Badge */}
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px]',
                'px-1 bg-red-500 text-white text-[10px] font-bold',
                'rounded-full flex items-center justify-center',
                'shadow-lg shadow-red-500/30'
              )}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </motion.span>
          )}
        </motion.div>

        {/* Label */}
        <motion.span
          className={cn(
            'text-[10px] mt-1 font-medium relative z-10',
            'transition-colors duration-200',
            isActive ? 'text-foreground' : 'text-muted-foreground'
          )}
          animate={{
            opacity: isActive ? 1 : 0.7,
            fontWeight: isActive ? 600 : 500,
          }}
          transition={{ duration: 0.2 }}
        >
          {item.label}
        </motion.span>
      </motion.div>
    </Link>
  );
}

// ============================================
// Main Component
// ============================================

export function MobileNav({ items = defaultNavItems, className }: MobileNavProps) {
  const pathname = usePathname();

  // Determine active index for indicator position
  const activeIndex = items.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springConfig, delay: 0.1 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        // Glass morphism background
        'bg-background/80 backdrop-blur-xl backdrop-saturate-150',
        'border-t border-border/50',
        // Safe area padding for iOS devices
        'pb-safe',
        // Only show on mobile
        'md:hidden',
        className
      )}
    >
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      <div className="flex items-center justify-around px-1 py-1">
        {items.map((item, index) => (
          <NavItemButton
            key={item.id}
            item={item}
            index={index}
            isActive={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
          />
        ))}
      </div>

      {/* Bottom safe area fill for iOS */}
      <div className="h-safe bg-background/80" />
    </motion.nav>
  );
}

export default MobileNav;
