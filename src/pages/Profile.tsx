import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { ShoppingBag, Settings, LogOut, ShieldCheck, User, Mail, AtSign, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Profile Header Card */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-[2rem] border-4 border-primary/20 p-1 bg-secondary-bg shadow-xl">
            <img 
              src={user?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt="Profile" 
              className="w-full h-full rounded-[1.8rem] object-cover"
            />
          </div>
          {user?.type === 'ADMIN' && (
            <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-2xl border-4 border-bg text-white shadow-lg">
              <ShieldCheck size={20} />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">
            {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'Your Name'}
          </h2>
          <p className="text-primary font-bold text-sm uppercase tracking-widest">{user?.type || 'USER'}</p>
        </div>
      </div>

      {/* Info Sections */}
      <div className="space-y-6">
        <LanguageSwitcher />

        <div className="space-y-4">
          <div className="flex items-center space-x-2 px-1">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{t('accountInfo')}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <InfoItem icon={<AtSign size={18} />} label={t('username')} value={user?.username ? `@${user.username}` : t('notSet')} />
            <InfoItem icon={<Mail size={18} />} label={t('email')} value={user?.email || t('notSet')} />
            <InfoItem icon={<Phone size={18} />} label={t('phone')} value="+251-XXX-XXXXXX" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <div className="w-1.5 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{t('menu')}</h3>
        </div>
        
        <div className="bg-bg border border-separator/30 rounded-[2.5rem] overflow-hidden divide-y divide-separator/30 shadow-sm">
          <ProfileMenuItem icon={<ShoppingBag size={20} />} label={t('myOrders')} />
          <ProfileMenuItem icon={<Settings size={20} />} label={t('settings')} />
          {user?.type === 'ADMIN' && (
            <ProfileMenuItem icon={<ShieldCheck size={20} className="text-primary" />} label="Master Admin Tools" />
          )}
          <ProfileMenuItem icon={<LogOut size={20} className="text-error" />} label={t('signOut')} isLast />
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] opacity-40">
          version 2.0.4 • built with ❤️
        </p>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-secondary-bg/50 border border-separator/30 rounded-3xl p-4 flex items-center justify-between group transition-all hover:bg-secondary-bg">
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 bg-bg rounded-2xl flex items-center justify-center text-secondary shadow-sm shadow-black/5">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{label}</span>
        <span className="text-sm font-black text-text">{value}</span>
      </div>
    </div>
  </div>
);

const ProfileMenuItem: React.FC<{ icon: React.ReactNode; label: string; isLast?: boolean }> = ({ icon, label, isLast }) => (
  <button className={`w-full px-8 py-5 flex items-center justify-between hover:bg-secondary-bg/50 active:bg-secondary-bg transition-all group ${isLast ? 'text-error' : ''}`}>
    <div className="flex items-center space-x-5">
      <div className={`${isLast ? 'text-error/30 group-active:text-error' : 'text-secondary/60 group-active:text-primary'} transition-colors`}>
        {icon}
      </div>
      <span className="font-black text-sm tracking-tight">{label}</span>
    </div>
    <div className={`w-1.5 h-1.5 border-t-2 border-r-2 ${isLast ? 'border-error/20' : 'border-separator'} rotate-45 group-active:translate-x-1 transition-transform`} />
  </button>
);
