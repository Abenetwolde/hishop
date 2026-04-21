import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Oromifa', flag: '🇪🇹' },
];

export const HeaderLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-secondary-bg/50 rounded-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-secondary-bg"
      >
        <span className="text-lg leading-none">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 bg-bg border border-separator/30 rounded-3xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="px-4 py-2 border-b border-separator/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">Language selection</p>
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary-bg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{lang.flag}</span>
                <span className={`text-sm font-bold ${i18n.language === lang.code ? 'text-primary' : 'text-text opacity-70'}`}>
                  {lang.name}
                </span>
              </div>
              {i18n.language === lang.code && (
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
