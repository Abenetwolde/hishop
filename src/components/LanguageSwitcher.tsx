import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: t('english'), flag: '🇺🇸' },
    { code: 'am', name: t('amharic'), flag: '🇪🇹' },
    { code: 'om', name: t('oromifa'), flag: '🇪🇹' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 px-1">
        <div className="w-1.5 h-4 bg-primary rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{t('selectLanguage')}</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${
              i18n.language === lang.code 
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                : 'border-separator/30 bg-secondary-bg/30 hover:bg-secondary-bg/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className={`font-black text-sm ${i18n.language === lang.code ? 'text-primary' : 'text-text'}`}>
                {lang.name}
              </span>
            </div>
            {i18n.language === lang.code && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <Check size={14} className="text-white stroke-[3px]" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
