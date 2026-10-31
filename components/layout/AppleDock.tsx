'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Briefcase, DollarSign, Settings, Wallet, 
  Map, Clock, Globe, CheckSquare, Sparkles, Command, Moon, Sun, Monitor, FileText, ClipboardList, TrendingUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser } from './UserContext';
import { sounds } from '@/lib/sound';

interface DockItemProps {
  name: string;
  href: string;
  icon: any;
  category?: string;
  badge?: number | string;
  onClick?: () => void;
  isAction?: boolean;
}

const navItems: DockItemProps[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Main' },
  { name: 'Marketplace', href: '/marketplace', icon: Globe, category: 'Marketplace' },
  { name: 'Clients', href: '/marketplace/clients', icon: Users, category: 'Marketplace' },
  { name: 'Projects', href: '/projects', icon: Briefcase, category: 'Operations' },
  { name: 'Proposals', href: '/proposals', icon: FileText, category: 'Operations' },
  { name: 'Requirements', href: '/requirements', icon: ClipboardList, category: 'Operations' },
  { name: 'SEO & Reports', href: '/seo', icon: TrendingUp, category: 'Operations' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, category: 'Operations' },
  { name: 'Roadmap', href: '/roadmap', icon: Map, category: 'Operations' },
  { name: 'Timesheets', href: '/timesheets', icon: Clock, category: 'Operations' },
  { name: 'Finance', href: '/finance', icon: DollarSign, category: 'Finance' },
  { name: 'Expenses', href: '/daily-expenses', icon: Wallet, category: 'Finance' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'System' },
];

function DockIcon({
  item,
  mouseX,
  pathname,
  onTriggerAction
}: {
  item: DockItemProps;
  mouseX: any;
  pathname: string;
  onTriggerAction?: (name: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Apple Dock magnification physics (42px -> 64px scale)
  const widthSync = useTransform(distance, [-140, 0, 140], [42, 64, 42]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 14 });

  const iconScaleSync = useTransform(distance, [-140, 0, 140], [18, 28, 18]);
  const iconSize = useSpring(iconScaleSync, { mass: 0.1, stiffness: 180, damping: 14 });

  const isActive = !item.isAction && (
    item.href === '/dashboard' 
      ? pathname === '/' || pathname === '/dashboard'
      : item.href === '/marketplace'
        ? pathname === '/marketplace' || (pathname.startsWith('/marketplace/') && !pathname.startsWith('/marketplace/clients'))
        : item.href === '/settings'
          ? pathname === '/settings' || pathname.startsWith('/settings/')
          : pathname.startsWith(item.href)
  );

  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    try {
      sounds.pop();
    } catch {
      // audio fallback
    }

    // Trigger signature Apple macOS Dock bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 700);

    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    } else if (item.isAction && onTriggerAction) {
      e.preventDefault();
      onTriggerAction(item.name);
    }
  };

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      animate={
        isBouncing 
          ? { 
              y: [0, -26, 0, -14, 0, -5, 0],
              scale: [1, 1.18, 0.92, 1.08, 0.98, 1.02, 1],
            } 
          : { y: 0, scale: 1 }
      }
      transition={
        isBouncing 
          ? { duration: 0.7, ease: [0.25, 1, 0.5, 1] } 
          : { duration: 0.2 }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`relative rounded-2xl flex items-center justify-center transition-colors cursor-pointer select-none group ${
        isActive
          ? 'bg-gradient-to-b from-[#6324FC]/35 to-[#6324FC]/15 border border-[#6324FC]/60 text-white shadow-[0_0_22px_rgba(99,36,252,0.4)]'
          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
      }`}
    >
      {/* Glossy top glass reflection highlight */}
      <div className="absolute top-0.5 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-full" />

      {/* Dynamic Animated Icon */}
      <motion.div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
        <Icon className={`w-full h-full transition-transform duration-200 group-hover:scale-110 ${
          isActive 
            ? 'text-[#6324FC] dark:text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
            : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
        }`} />
      </motion.div>

      {/* Floating Apple-Style Tooltip Pill */}
      <AnimatePresence>
        {isHovered && !isBouncing && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 6, scale: 0.85, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-black/90 dark:bg-[#0a0a0d]/95 backdrop-blur-2xl border border-white/15 text-white text-[11px] font-heading font-bold tracking-wide shadow-2xl whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5"
          >
            <span>{item.name}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Glowing Indicator Dot */}
      {isActive && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
      )}
    </motion.div>
  );

  if (item.isAction) {
    return content;
  }

  return (
    <Link href={item.href} className="outline-none focus:outline-none">
      {content}
    </Link>
  );
}

export default function AppleDock() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'viewer') return true;
    
    if (user.role === 'admin') {
      if (item.href === '/daily-expenses') return false;
      return true;
    }
    
    if (user.role === 'editor') {
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/projects', '/proposals', '/tasks', '/roadmap', '/timesheets'];
      return allowed.includes(item.href);
    }

    if (user.role === 'marketplace_team') {
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/proposals', '/tasks'];
      return allowed.includes(item.href);
    }
    
    return false;
  });

  const handleTriggerAction = (name: string) => {
    if (name === 'Command Center') {
      window.dispatchEvent(new CustomEvent('open-command-center'));
    } else if (name === 'AI Copilot') {
      window.dispatchEvent(new CustomEvent('open-ai-chat'));
    } else if (name === 'Toggle Theme') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      try { sounds.pop(); } catch {}
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center max-w-[calc(100vw-32px)]">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative flex items-end gap-2 px-3.5 py-2.5 rounded-3xl bg-white/75 dark:bg-[#07080b]/80 backdrop-blur-3xl border border-black/10 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_30px_rgba(99,36,252,0.15)] ring-1 ring-black/5 dark:ring-white/10 overflow-visible"
      >
        {/* Soft Liquid Glass Top Accent Line */}
        <div className="absolute -top-[1px] inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#6324FC]/60 via-[#00E5FF]/60 to-transparent pointer-events-none rounded-full" />

        {/* Main Navigation Items */}
        {filteredNavItems.map((item) => (
          <DockIcon
            key={item.name}
            item={item}
            mouseX={mouseX}
            pathname={pathname}
          />
        ))}

        {/* Separator Divider */}
        <div className="h-9 w-[1px] bg-black/10 dark:border-white/15 mx-1 my-auto self-center opacity-60" />

        {/* Quick System Action Icons (Apple Dock Right Side) */}
        <DockIcon
          item={{
            name: 'Command Center',
            href: '#',
            icon: Command,
            isAction: true
          }}
          mouseX={mouseX}
          pathname={pathname}
          onTriggerAction={handleTriggerAction}
        />

        <DockIcon
          item={{
            name: 'AI Copilot',
            href: '#',
            icon: Sparkles,
            isAction: true
          }}
          mouseX={mouseX}
          pathname={pathname}
          onTriggerAction={handleTriggerAction}
        />

        <DockIcon
          item={{
            name: 'Toggle Theme',
            href: '#',
            icon: theme === 'dark' ? Sun : Moon,
            isAction: true
          }}
          mouseX={mouseX}
          pathname={pathname}
          onTriggerAction={handleTriggerAction}
        />
      </motion.div>
    </div>
  );
}
