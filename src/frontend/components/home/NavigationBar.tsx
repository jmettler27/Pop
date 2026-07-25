'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { CirclePlus, Gamepad2, Info, Languages, List, MessageSquare } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { useLocale } from '@/app/LocaleProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { Button } from '@/frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { LOCALE_TO_TITLE, LOCALES, type Locale } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.home.HomeBar', {
  games: 'Games',
  about: 'About',
  settingsProfile: 'Profile',
  settingsAccount: 'Account',
  settingsDashboard: 'Dashboard',
  settingsLogout: 'Logout',
  selectLanguage: 'Select Language',
});

export function NavigationBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const isGuest = Boolean(user?.isGuest);
  const { locale, setLocale } = useLocale();
  const intl = useIntl();
  const router = useRouter();

  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);

  const handleCloseUserMenu = () => setUserMenuOpen(false);
  const handleCloseLangMenu = () => setLangMenuOpen(false);

  const allPages = [
    { label: intl.formatMessage(messages.games), icon: <List className="mr-2 size-4" />, href: '/' },
    {
      label: intl.formatMessage(globalMessages.createNewGame),
      icon: <CirclePlus className="mr-2 size-4" />,
      href: '/edit',
    },
    {
      label: intl.formatMessage(globalMessages.submitQuestion),
      icon: <MessageSquare className="mr-2 size-4" />,
      href: '/submit',
    },
    { label: intl.formatMessage(messages.about), icon: <Info className="mr-2 size-4" />, href: '/about' },
  ];

  const pages = isGuest ? allPages.slice(0, 1) : allPages;

  const settingsList = [
    { label: intl.formatMessage(messages.settingsProfile), action: () => {} },
    { label: intl.formatMessage(messages.settingsAccount), action: () => {} },
    { label: intl.formatMessage(messages.settingsDashboard), action: () => {} },
    { label: intl.formatMessage(messages.settingsLogout), action: () => signOut() },
  ];

  const handleSelectPage = (href: string) => router.push(href);

  const handleSelectLanguage = (langCode: Locale) => {
    setLocale(langCode);
    handleCloseLangMenu();
  };

  return (
    <header className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-500 shadow-md">
      <div className="mx-auto w-full max-w-[1536px] px-4">
        <nav className="flex items-center min-h-14 sm:min-h-16">
          <Gamepad2 className="hidden md:flex mr-2 size-6" />
          <NextLink
            href="/"
            className="mr-6 hidden md:flex text-xl whitespace-nowrap font-mono font-bold tracking-[.15rem] text-inherit no-underline transition-transform hover:scale-105 [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]"
          >
            Pop!
          </NextLink>

          <Gamepad2 className="flex md:hidden mr-2 size-6" />
          <NextLink
            href="/"
            className="mr-4 flex md:hidden grow text-xl whitespace-nowrap font-mono font-bold tracking-[.15rem] text-inherit no-underline [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]"
          >
            Pop!
          </NextLink>

          <div className="grow hidden md:flex gap-1">
            {pages.map((page) => (
              <Button
                key={page.href}
                variant="ghost"
                onClick={() => handleSelectPage(page.href)}
                className="flex normal-case text-white text-sm font-semibold px-2 py-1 transition-all duration-200 hover:bg-white/15 hover:text-white hover:-translate-y-0.5"
              >
                {page.icon}
                {page.label}
              </Button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="grow-0 mr-4">
            <DropdownMenu open={langMenuOpen} onOpenChange={setLangMenuOpen}>
              <Tooltip>
                <DropdownMenuTrigger render={<TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} />}>
                  <Languages className="text-white size-6" />
                </DropdownMenuTrigger>
                <TooltipContent>{intl.formatMessage(messages.selectLanguage)}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                {LOCALES.map((code) => (
                  <DropdownMenuCheckboxItem
                    key={code}
                    checked={locale === code}
                    onClick={() => handleSelectLanguage(code)}
                  >
                    <p className="w-full text-center">{LOCALE_TO_TITLE[code]}</p>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User menu */}
          {!isGuest && (
            <div className="grow-0">
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <Tooltip>
                  <DropdownMenuTrigger
                    render={<TooltipTrigger render={<Button variant="ghost" size="icon" className="p-0" />} />}
                  >
                    <Avatar className="size-9">
                      <AvatarImage alt={user?.name ?? ''} src={user?.image ?? ''} />
                      <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <TooltipContent>Open settings</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  {settingsList.map((setting) => (
                    <DropdownMenuItem
                      key={setting.label}
                      onClick={() => {
                        setting.action();
                        handleCloseUserMenu();
                      }}
                    >
                      <p className="w-full text-center">{setting.label}</p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default NavigationBar;
