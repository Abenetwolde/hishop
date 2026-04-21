import React, { useEffect } from 'react';
import { 
  init,
  miniApp,
  themeParams,
  viewport,
  mainButton,
  backButton,
  isTMA,
} from '@telegram-apps/sdk';

let isInitializing = false;

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const initTMA = async () => {
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        // Only initialize if in TMA environment
        if (await isTMA()) {
          try {
            init();
          } catch (e) {
            console.warn('SDK already initialized');
          }
          
          // Initialize components with safety checks
          const mountSafely = async (component: any) => {
            try {
              if (component.mount.isAvailable() && !component.isMounted()) {
                await component.mount();
              }
            } catch (e) {
              console.warn(`Failed to mount component:`, e);
            }
          };

          await mountSafely(miniApp);
          await mountSafely(themeParams);
          await mountSafely(viewport);
          await mountSafely(mainButton);
          await mountSafely(backButton);

          // Bind CSS vars
          if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
          
          // Theme Binding
          if (themeParams.bindCssVars.isAvailable()) {
              themeParams.bindCssVars();
          } else if (themeParams.isMounted()) {
              // Fallback for styling
              const root = document.documentElement;
              const p = themeParams as any;
              const map: Record<string, string | undefined> = {
                '--tg-theme-bg-color': p.bgColor || p.value?.bgColor,
                '--tg-theme-text-color': p.textColor || p.value?.textColor,
                '--tg-theme-hint-color': p.hintColor || p.value?.hintColor,
                '--tg-theme-link-color': p.linkColor || p.value?.linkColor,
                '--tg-theme-button-color': p.buttonColor || p.value?.buttonColor,
                '--tg-theme-button-text-color': p.buttonTextColor || p.value?.buttonTextColor,
                '--tg-theme-secondary-bg-color': p.secondaryBgColor || p.value?.secondaryBgColor,
                '--tg-theme-section-bg-color': p.sectionBgColor || p.value?.sectionBgColor,
                '--tg-theme-section-separator-color': p.sectionSeparatorColor || p.value?.sectionSeparatorColor,
                '--tg-theme-header-bg-color': p.headerBgColor || p.value?.headerBgColor,
                '--tg-theme-accent-text-color': p.accentTextColor || p.value?.accentTextColor,
                '--tg-theme-destructive-text-color': p.destructiveTextColor || p.value?.destructiveTextColor,
              };
              Object.entries(map).forEach(([key, value]) => {
                if (value) root.style.setProperty(key, value);
              });
          }

          if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();
        }
      } catch (e) {
        console.error('TMA Provider Init Error:', e);
      } finally {
        isInitializing = false;
      }
    };

    initTMA();
  }, []);

  return <>{children}</>;
};
