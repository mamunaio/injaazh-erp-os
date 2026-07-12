'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AccentColor = 'violet' | 'blue' | 'green' | 'rose' | 'amber';
type SidebarLayout = 'expanded' | 'collapsed';

interface AppearanceContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  sidebarLayout: SidebarLayout;
  setSidebarLayout: (layout: SidebarLayout) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState<AccentColor>('violet');
  const [sidebarLayout, setSidebarLayout] = useState<SidebarLayout>('expanded');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedAccent = localStorage.getItem('injaazh-accent') as AccentColor;
    const savedSidebar = localStorage.getItem('injaazh-sidebar') as SidebarLayout;
    
    if (savedAccent) setAccentColor(savedAccent);
    if (savedSidebar) setSidebarLayout(savedSidebar);
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save to localStorage
    localStorage.setItem('injaazh-accent', accentColor);
    localStorage.setItem('injaazh-sidebar', sidebarLayout);
    
    // Apply CSS variables or data attributes to document.body
    document.documentElement.setAttribute('data-accent', accentColor);
    
  }, [accentColor, sidebarLayout, mounted]);

  return (
    <AppearanceContext.Provider value={{ accentColor, setAccentColor, sidebarLayout, setSidebarLayout }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
