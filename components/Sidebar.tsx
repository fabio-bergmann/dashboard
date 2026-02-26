"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M17.8385 2H6.16146C5.63433 1.99998 5.17954 1.99997 4.80497 2.03057C4.40963 2.06287 4.01641 2.13419 3.63803 2.32698C3.07354 2.6146 2.6146 3.07354 2.32698 3.63803C2.13419 4.01641 2.06287 4.40963 2.03057 4.80497C1.99997 5.17954 1.99998 5.63429 2 6.16142V6.4C2 6.96005 2 7.24008 2.10899 7.45399C2.20487 7.64215 2.35785 7.79513 2.54601 7.89101C2.75992 8 3.03995 8 3.6 8H20.4C20.9601 8 21.2401 8 21.454 7.89101C21.6422 7.79513 21.7951 7.64215 21.891 7.45399C22 7.24008 22 6.96005 22 6.4V6.16144C22 5.6343 22 5.17954 21.9694 4.80497C21.9371 4.40963 21.8658 4.01641 21.673 3.63803C21.3854 3.07354 20.9265 2.6146 20.362 2.32698C19.9836 2.13419 19.5904 2.06287 19.195 2.03057C18.8205 1.99997 18.3657 1.99998 17.8385 2Z" fill="currentColor"/>
      <path d="M22 11.6C22 11.0399 22 10.7599 21.891 10.546C21.7951 10.3578 21.6422 10.2049 21.454 10.109C21.2401 10 20.9601 10 20.4 10H11.6C11.0399 10 10.7599 10 10.546 10.109C10.3578 10.2049 10.2049 10.3578 10.109 10.546C10 10.7599 10 11.0399 10 11.6L10 20.4C10 20.9601 10 21.2401 10.109 21.454C10.2049 21.6422 10.3578 21.7951 10.546 21.891C10.7599 22 11.0399 22 11.6 22H17.8386C18.3657 22 18.8205 22 19.195 21.9694C19.5904 21.9371 19.9836 21.8658 20.362 21.673C20.9265 21.3854 21.3854 20.9265 21.673 20.362C21.8658 19.9836 21.9371 19.5904 21.9694 19.195C22 18.8205 22 18.3657 22 17.8386V11.6Z" fill="currentColor"/>
      <path d="M6.4 22C6.96005 22 7.24008 22 7.45399 21.891C7.64215 21.7951 7.79514 21.6422 7.89101 21.454C8 21.2401 8 20.9601 8 20.4L8 11.6C8 11.0399 8 10.7599 7.89101 10.546C7.79513 10.3578 7.64215 10.2049 7.45399 10.109C7.24008 10 6.96005 10 6.4 10H3.6C3.03995 10 2.75992 10 2.54601 10.109C2.35785 10.2049 2.20487 10.3578 2.10899 10.546C2 10.7599 2 11.0399 2 11.6V17.8385C1.99998 18.3657 1.99997 18.8205 2.03057 19.195C2.06287 19.5904 2.13419 19.9836 2.32698 20.362C2.6146 20.9265 3.07354 21.3854 3.63803 21.673C4.01641 21.8658 4.40963 21.9371 4.80497 21.9694C5.17954 22 5.6343 22 6.16144 22H6.4Z" fill="currentColor"/>
    </svg>
  );
}

function PersonalBrandIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9928 3.71703C9.65285 1.67214 6.19239 1.25369 3.50509 3.54978C0.598301 6.0334 0.175971 10.2162 2.47459 13.1741C3.34712 14.2968 5.05011 15.9836 6.68672 17.5284C8.34249 19.0912 9.99445 20.568 10.8091 21.2895C10.8142 21.294 10.8194 21.2986 10.8247 21.3033C10.9012 21.3712 10.9966 21.4557 11.088 21.5245C11.1974 21.6069 11.3545 21.7092 11.5643 21.7718C11.8432 21.855 12.143 21.855 12.422 21.7718C12.6318 21.7092 12.7889 21.6069 12.8983 21.5245C12.9897 21.4557 13.085 21.3712 13.1616 21.3033C13.1669 21.2986 13.1721 21.294 13.1772 21.2895C13.9918 20.568 15.6438 19.0912 17.2996 17.5284C18.9362 15.9836 20.6392 14.2968 21.5117 13.1741C23.8015 10.2276 23.4444 6.0125 20.4708 3.54101C17.7536 1.28258 14.33 1.67136 11.9928 3.71703Z" fill="currentColor"/>
    </svg>
  );
}

function ApiStatsIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 20V10h4v10H3ZM10 20V4h4v16h-4ZM17 20v-7h4v7h-4Z" fill="currentColor"/>
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14.126 9L3 9C2.44772 9 2 8.55228 2 8C2 7.44772 2.44772 7 3 7L14.126 7C14.5701 5.27477 16.1362 4 18 4C20.2091 4 22 5.79086 22 8C22 10.2091 20.2091 12 18 12C16.1362 12 14.5701 10.7252 14.126 9Z" fill="currentColor"/>
      <path d="M6 12C3.79086 12 2 13.7909 2 16C2 18.2091 3.79086 20 6 20C7.86384 20 9.42994 18.7252 9.87398 17L21 17C21.5523 17 22 16.5523 22 16C22 15.4477 21.5523 15 21 15L9.87398 15C9.42994 13.2748 7.86384 12 6 12Z" fill="currentColor"/>
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Personal Brand", href: "/personal-brand", icon: PersonalBrandIcon },
  { label: "API Stats", href: "/api-stats", icon: ApiStatsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[210px] flex-col bg-surface px-3 py-6">
      <nav className="flex flex-1 flex-col justify-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-foreground border-border"
                  : "border-transparent text-muted hover:bg-task-hover hover:text-foreground"
              }`}
            >
              <Icon className="text-accent" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-2">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </aside>
  );
}
