"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Drawer, Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// Dynamically import TrackModal to avoid SSR issues
const TrackModal = dynamic(() => import("@/components/landing/TrackModal"), {
  ssr: false,
});

interface PublicHeaderProps {
  defaultTrackCode?: string;
}

export function PublicHeader({ defaultTrackCode }: PublicHeaderProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  const { theme, setTheme } = useTheme();

  // Use useSyncExternalStore for mounted detection (avoids setState in effect)
  const emptySubscribe = useCallback(() => () => {}, []);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && theme === "dark";
  const isHomePage = pathname === "/";
  const usesDarkHeader = !isHomePage || scrolled;

  useEffect(() => {
    const handleScroll = () => {
      // Trigger the scrolled state only after passing 100vh
      setScrolled(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Call once on mount in case the page loads scrolled down
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler for hash links
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsDrawerOpen(false); // Close drawer
      }
    }
  };

  const handleLinkClick = () => {
    setIsDrawerOpen(false); // Close drawer
  };

  const handleTrackOpen = () => {
    setIsTrackOpen(true);
    setIsDrawerOpen(false); // Close drawer if open
  };

  const navLinks = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Departments", href: "/#departments" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#footer" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          usesDarkHeader
            ? "border-b border-neutral-200 bg-white/95 backdrop-blur-xl shadow-sm"
            : "border-b border-transparent bg-transparent backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
          <Link
            href="/"
            className={`flex items-center gap-3 font-semibold ${
              usesDarkHeader ? "text-black" : "text-white"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-lg shadow-primary-500/20">
              K
            </span>
            <span
              className={`hidden text-base tracking-tight sm:inline ${
                usesDarkHeader ? "text-black" : "text-white/90"
              }`}
            >
              KwaraMOc Complaints
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className={`text-sm font-medium transition-colors ${
                  usesDarkHeader
                    ? "text-neutral-700 hover:text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark mode toggle - Desktop */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`hidden rounded-lg p-2 transition-colors sm:flex ${
                  usesDarkHeader
                  ? "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light mode (D)" : "Dark mode (D)"}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Track Complaint — desktop only; mobile users get this from the drawer */}
            <button
              onClick={handleTrackOpen}
              className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition-all md:inline-flex ${
                usesDarkHeader
                  ? "border border-neutral-200 bg-white text-black hover:bg-neutral-100"
                  : "border border-white/20 bg-neutral-50/5 text-white hover:bg-neutral-50/10 hover:border-white/30"
              }`}
            >
              Track Complaint
            </button>
            <Link
              href="/report"
              className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:shadow-primary-600/30 hover:scale-105"
            >
              Submit Complaint
            </Link>
            {/* Mobile hamburger - opens HeroUI Drawer */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center justify-center rounded-lg p-2 transition-colors md:hidden ${
                usesDarkHeader
                  ? "text-black hover:bg-neutral-100"
                  : "text-white hover:bg-neutral-50/10"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      {!isHomePage && <div aria-hidden="true" className="h-[68px] shrink-0" />}

      {/* HeroUI v3 Drawer */}
      <Drawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            {/* Adjusted background to use standard theme variables for dark mode support */}
            <Drawer.Dialog className="bg-background text-foreground">
              {/* Close trigger lives inline in this row, next to the logo — not the
                  default floating position */}
              <Drawer.Header className="flex items-center justify-between border-b border-border/10 px-4 py-3">
                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 font-semibold text-foreground"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                    K
                  </span>
                  <span className="text-sm tracking-tight">KwaraMOc</span>
                </Link>
                <Drawer.CloseTrigger>
                  <Button
                    isIconOnly
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="px-2 py-4">
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.startsWith("/#")) {
                          e.preventDefault();
                          const targetId = link.href.replace("/#", "");
                          const element = document.getElementById(targetId);
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                            setIsDrawerOpen(false);
                          }
                        } else {
                          setIsDrawerOpen(false);
                        }
                      }}
                      className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="my-4 border-t border-border/10" />

                  {/* Mobile CTAs & Theme Toggle */}
                  <div className="space-y-2 px-4">
                    {/* Mobile Theme Toggle */}
                    <button
                      onClick={() => setTheme(isDark ? "light" : "dark")}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <span>
                        {isDark
                          ? "Switch to Light Mode"
                          : "Switch to Dark Mode"}
                      </span>
                      {isDark ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={handleTrackOpen}
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Track Complaint
                    </button>
                    <Link
                      href="/report"
                      onClick={handleLinkClick}
                      className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:shadow-primary-600/30"
                    >
                      Submit Complaint
                    </Link>
                  </div>
                </div>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      {/* Track Modal */}
      <TrackModal isOpen={isTrackOpen} onOpenChange={setIsTrackOpen} />
    </>
  );
}
