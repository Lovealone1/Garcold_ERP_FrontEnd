'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { getNavSections } from '@/lib/navigation';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { NavSection } from '@/types/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform ${open ? 'rotate-90' : ''}`}
  >
    <path d="M9 18l6-6l-6-6" />
  </svg>
);

const SidebarHeader: React.FC<{ expanded: boolean; basePath: string }> = ({ expanded, basePath }) => (
  <div className={`flex items-center ${!expanded ? 'justify-center' : ''} gap-3 px-2 pt-4 pb-4`}>
    <Link
      href="/"
      className={`flex items-center ${!expanded ? 'justify-center' : ''} gap-3 px-2 pt-4 pb-4`}
    >
      <Image
        src={`${basePath}/garcold.png`}
        alt="Garcold logo"
        width={36}
        height={36}
        priority
        className="h-12 w-12 object-contain"
      />
      <h1
        className={`text-base font-bold tracking-tight transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'
          } ${expanded ? 'block' : 'hidden'}`}
      >
        Tienda Garcold
      </h1>
    </Link>
  </div>
);

const SidebarNavCollapsed: React.FC<{ sections: NavSection[]; pathname: string | null }> = ({
  sections,
  pathname,
}) => (
  <nav className="flex-1 overflow-y-auto">
    <ul className="mt-2 flex flex-col items-center gap-6">
      {sections.map((section) => {
        const href = section.items[0]?.href || '#';
        const active = pathname?.startsWith(href);
        return (
          <li key={section.title}>
            <Link
              href={href}
              className={`flex h-10 w-10 items-center justify-center rounded-md ${active
                ? 'bg-tg-primary/10 text-tg-primary'
                : 'text-tg-muted hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              aria-label={section.title}
            >
              {section.iconName ? (
                <MaterialIcon
                  name={section.iconName}
                  set={section.iconSet}
                  size={24}
                  className={active ? 'text-tg-primary' : 'text-tg-muted'}
                />
              ) : (
                <span
                  className={active ? 'text-tg-primary' : 'text-tg-muted'}
                  dangerouslySetInnerHTML={{ __html: section.icon as string }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

const SidebarNavExpanded: React.FC<{
  sections: NavSection[];
  pathname: string | null;
  openSections: Record<string, boolean>;
  onToggleSection: (title: string) => void;
}> = ({ sections, pathname, openSections, onToggleSection }) => (
  <nav className="flex-1 overflow-y-auto">
    {sections.map((section) => {
      const open = !!openSections[section.title];
      const SectionIcon = section.iconName ? (
        <MaterialIcon name={section.iconName} set={section.iconSet} size={24} className="text-tg-muted" />
      ) : section.icon ? (
        <span className="text-tg-muted" dangerouslySetInnerHTML={{ __html: section.icon }} />
      ) : null;

      return (
        <div key={section.title} className="mb-4 px-2">
          <button
            type="button"
            onClick={() => onToggleSection(section.title)}
            className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition text-sm text-tg-fg"
          >
            {SectionIcon}
            <span className="flex-1 text-left font-medium">{section.title}</span>
            <ChevronIcon open={open} />
          </button>

          {open && (
            <ul className="mt-2 ml-5 space-y-1">
              {section.items.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition ${active
                        ? 'bg-tg-primary/10 text-tg-primary'
                        : 'text-tg-muted hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                      {item.iconName ? (
                        <MaterialIcon
                          name={item.iconName}
                          set={item.iconSet}
                          size={22}
                          className={active ? 'text-tg-primary' : 'text-tg-muted'}
                        />
                      ) : (
                        <span
                          className={active ? 'text-tg-primary' : 'text-tg-muted'}
                          dangerouslySetInnerHTML={{ __html: item.icon as string }}
                        />
                      )}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    })}
  </nav>
);

const ThemeToggle: React.FC<{ expanded: boolean; isDark: boolean; onToggle: () => void }> = ({
  expanded,
  isDark,
  onToggle,
}) => (
  <div className="mt-auto px-2 pb-4">
    {!expanded ? (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isDark}
          className="h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
        >
          <MaterialIcon name={isDark ? 'dark_mode' : 'light_mode'} size={22} className="text-tg-muted" />
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-start gap-3">
        <MaterialIcon name="light_mode" size={20} className="text-tg-muted" />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isDark}
          className="relative inline-flex h-6 w-12 items-center rounded-full bg-tg-border"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-tg-primary transition ${isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
        <MaterialIcon name="dark_mode" size={20} className="text-tg-muted" />
      </div>
    )}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState(false);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const nextIsDark = saved ? saved === 'dark' : true;
      setIsDark(nextIsDark);
      document.documentElement.classList.toggle('dark', nextIsDark);
    } catch { }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch { }
    document.documentElement.classList.toggle('dark', next);
  };

  const sections = useMemo(() => getNavSections(), []);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    sections.forEach((s) => {
      next[s.title] = s.items.some((i) => pathname?.startsWith(i.href));
    });
    setOpenSections((prev) => ({ ...next, ...prev }));
  }, [pathname, sections]);

  const expanded = hovered || isOpen;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') onClose();
          }}
        />
      )}

      <aside
        data-role="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col
                    bg-tg-card text-tg-fg
                    border-r border-tg
                    shadow-xl
                    transform transition-[width,transform] duration-100 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    ${expanded ? 'w-72' : 'w-16'}`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <SidebarHeader expanded={expanded} basePath={basePath} />

        {!expanded ? (
          <SidebarNavCollapsed sections={sections} pathname={pathname} />
        ) : (
          <SidebarNavExpanded
            sections={sections}
            pathname={pathname}
            openSections={openSections}
            onToggleSection={(title) => setOpenSections((s) => ({ ...s, [title]: !s[title] }))}
          />
        )}

        <ThemeToggle expanded={expanded} isDark={isDark} onToggle={toggleTheme} />
      </aside>
    </>
  );
};

export default Sidebar;
