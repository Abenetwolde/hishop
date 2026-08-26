import React, { useState } from 'react';
import { Home } from '../../pages/Home';
import { Cart } from '../../pages/Cart';
import { Profile } from '../../pages/Profile';
import { Search } from '../../pages/Search';
import { Orders } from '../../pages/Orders';
import { Notifications } from '../../pages/Notifications';
import { AllProducts } from '../../pages/AllProducts';
import { ProductDetail } from '../ProductDetail';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  ShoppingCart,
  User as UserIcon,
  Bell,
  Package
} from 'lucide-react';
import { HeaderLanguageSwitcher } from '../HeaderLanguageSwitcher';
import { useCartStore } from '../../store/cart-store';
import { useAuth } from '../../providers/AuthProvider';
import { useTranslation } from 'react-i18next';

type Tab = 'home' | 'search' | 'cart' | 'profile' | 'orders' | 'notifications' | 'all-products' | 'category' | 'product-detail';

interface NavParams {
  categoryId?: number;
  categoryName?: string;
  product?: any;
}

export const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [navParams, setNavParams] = useState<NavParams>({});
  const { user } = useAuth();
  const { t } = useTranslation();
  const itemCount = useCartStore(state => state.getItemCount());

  const onNavigate = (tab: string, params?: Record<string, unknown>) => {
    setActiveTab(tab as Tab);
    setNavParams((params as NavParams) || {});
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home onNavigate={onNavigate} />;
      case 'search': return <Search onNavigate={onNavigate} />;
      case 'cart': return <Cart onNavigate={onNavigate} />;
      case 'profile': return <Profile />;
      case 'orders': return <Orders onNavigate={onNavigate} />;
      case 'notifications': return <Notifications />;
      case 'all-products': return <AllProducts onNavigate={onNavigate} />;
      case 'category': return (
        <AllProducts
          onNavigate={onNavigate}
          categoryId={navParams.categoryId}
          categoryName={navParams.categoryName}
        />
      );
      case 'product-detail': return (
        <ProductDetail
          product={navParams.product}
          onClose={() => onNavigate('home')}
          onNavigate={onNavigate}
        />
      );
      default: return <Home onNavigate={onNavigate} />;
    }
  };

  const isDetailView = activeTab === 'product-detail';

  if (isDetailView) return renderContent();

  return (
    <div className="min-h-screen bg-bg text-text pb-20 overflow-x-hidden">
      <header className="p-4 bg-bg sticky top-0 z-40 flex items-center justify-between border-b border-separator shadow-sm backdrop-blur-md bg-opacity-90">
        <h1
          onClick={() => onNavigate('home')}
          className="text-xl font-bold text-primary cursor-pointer"
        >
          HiShop
        </h1>
        <div className="flex items-center space-x-3">
          <HeaderLanguageSwitcher />
          <button
            onClick={() => onNavigate('notifications')}
            className={`p-2 rounded-full relative transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary-bg'}`}
          >
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-bg" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
        </div>
      </header>

      <main className={`container mx-auto max-w-lg ${isDetailView ? '' : ' py-4'}`}>
        {renderContent()}
      </main>

      {!isDetailView && (
        <nav className="fixed bottom-0 left-0 right-0 h-18 bg-bg/80 backdrop-blur-2xl flex items-center justify-around border-t border-separator z-50 px-2 max-w-lg mx-auto rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <NavItem
            label={t('tabShop')}
            icon={<HomeIcon size={22} />}
            active={activeTab === 'home'}
            onClick={() => onNavigate('home')}
          />
          <NavItem
            label={t('tabSearch')}
            icon={<SearchIcon size={22} />}
            active={activeTab === 'search'}
            onClick={() => onNavigate('search')}
          />
          <NavItem
            label={t('tabOrders')}
            icon={<Package size={22} />}
            active={activeTab === 'orders'}
            onClick={() => onNavigate('orders')}
          />
          <NavItem
            label={t('tabCart')}
            icon={<ShoppingCart size={22} />}
            active={activeTab === 'cart'}
            onClick={() => onNavigate('cart')}
            badge={itemCount > 0 ? itemCount : undefined}
          />
          <NavItem
            label={t('tabProfile')}
            icon={<UserIcon size={22} />}
            active={activeTab === 'profile'}
            onClick={() => onNavigate('profile')}
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ label, icon, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center space-y-1 w-16 h-full transition-all duration-300 ${active ? 'text-primary' : 'text-secondary opacity-60'}`}
  >
    <div className={`transition-all duration-300 ${active ? 'scale-110 -translate-y-1.5' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 scale-75'}`}>
      {label}
    </span>
    {badge !== undefined && (
      <span className="absolute top-2 right-2.5 min-w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-bg shadow-sm">
        {badge}
      </span>
    )}
  </button>
);
