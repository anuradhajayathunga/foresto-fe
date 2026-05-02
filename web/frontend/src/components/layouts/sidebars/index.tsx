'use client';

import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_DATA } from './data';
import { ArrowLeftIcon, ChevronUp } from './icons';
import { MenuItem } from './menu-item';
import { useSidebarContext } from './sidebar-context';

interface NavItem {
  title: string;
  url: string;
  onClick?: () => void;
}

interface NavSection {
  label: string;
  items: Array<{
    title: string;
    icon: React.ComponentType;
    items: NavItem[];
    url?: string;
  }>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();

  const isItemActive = (item: NavSection['items'][number]) => {
    const parentActive =
      item.url &&
      (pathname === item.url || pathname.startsWith(`${item.url}/`));
    const childActive = item.items.some(({ url }) => url === pathname);

    return Boolean(parentActive || childActive);
  };

  const isItemExpanded = (item: NavSection['items'][number]) => {
    const parentActive =
      item.url &&
      (pathname === item.url || pathname.startsWith(`${item.url}/`));
    const childActive = item.items.some(({ url }) => url === pathname);

    return Boolean(parentActive || childActive);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 transition-opacity duration-300'
          onClick={() => setIsOpen(false)}
          aria-hidden='true'
        />
      )}

      <aside
        className={cn(
          'min-w-[300px] overflow-hidden border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-[width] duration-200 ease-linear z-30',
          isMobile ? 'fixed bottom-0 top-0 z-30' : 'sticky top-0 h-screen',
          isOpen ? 'w-full' : 'w-0'
        )}
        aria-label='Main navigation'
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className='flex h-full flex-col py-10 pl-[25px] pr-[7px]'>
          <div className='relative pr-4.5'>
            <Link
              href={'/dashboard'}
              onClick={() => isMobile && toggleSidebar()}
              className='flex items-center'
              aria-label='Go to dashboard'
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className='rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition'
              >
                <span className='sr-only'>Close Menu</span>

                <ArrowLeftIcon className='ml-auto size-7' />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className='custom-scrollbar mt-6 flex-1 overflow-y pr-3 min-[850px]:mt-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
            {NAV_DATA.map((section) => (
              <div key={section.label} className='mb-6'>
                <h2 className='mb-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  {section.label}
                </h2>

                <nav role='navigation' aria-label={section.label}>
                  <ul className='space-y-2'>
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            {(() => {
                              const href =
                                item.url ??
                                '/' + item.title.toLowerCase().split(' ').join('-');

                              return (
                            <MenuItem
                              as='link'
                              href={href}
                              isActive={isItemActive(item)}
                              className='flex items-center gap-3 py-3'
                            >
                              <item.icon aria-hidden='true' />

                              <span>{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  'ml-auto rotate-180 transition-transform duration-200',
                                  isItemExpanded(item) && 'rotate-0'
                                )}
                                aria-hidden='true'
                              />
                            </MenuItem>
                              );
                            })()}

                            {isItemExpanded(item) && (
                              <ul
                                className='ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2'
                                role='menu'
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role='none'>
                                    {'onClick' in subItem && subItem.onClick ? (
                                      <MenuItem
                                        as='button'
                                        onClick={() => {
                                          subItem.onClick?.();
                                          isMobile && toggleSidebar();
                                        }}
                                        isActive={pathname === subItem.url}
                                      >
                                        <span>{subItem.title}</span>
                                      </MenuItem>
                                    ) : (
                                      <MenuItem
                                        as='link'
                                        href={subItem.url}
                                        isActive={pathname === subItem.url}
                                      >
                                        <span>{subItem.title}</span>
                                      </MenuItem>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              'url' in item
                                ? item.url + ''
                                : '/' +
                                  item.title.toLowerCase().split(' ').join('-');

                            // FIX: Check for exact match OR if we are on a sub-page
                            const isActive =
                              pathname === href ||
                              (href !== '/' && pathname.startsWith(`${href}/`));

                            return (
                              <MenuItem
                                className='flex items-center gap-3 py-3'
                                as='link'
                                href={href}
                                isActive={isActive}
                              >
                                <item.icon aria-hidden='true' />

                                <span>{item.title}</span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
