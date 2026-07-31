import { create } from "zustand";

interface BreadcrumbState {
  /** Custom title for the current page (overrides pathname-derived title) */
  customTitle: string | null;
  /** Set a custom breadcrumb title (e.g. ticket code) */
  setCustomTitle: (title: string | null) => void;
}

/**
 * Lightweight store that lets any page set a custom breadcrumb title.
 * The Topbar reads `customTitle`; when non-null it takes precedence
 * over the pathname-derived title from getPageTitle().
 */
export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  customTitle: null,
  setCustomTitle: (title) => set({ customTitle: title }),
}));
