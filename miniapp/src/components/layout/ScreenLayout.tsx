import { ReactNode, useEffect } from 'react';
import { getTelegramWebApp } from '@/utils/telegram';

interface ScreenLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  showBottomNav?: boolean;
  contentClassName?: string;
  noPadding?: boolean;
  fullScreen?: boolean;
}

export default function ScreenLayout({
  header,
  children,
  showBottomNav = true,
  contentClassName = '',
  noPadding = false,
  fullScreen = false,
}: ScreenLayoutProps) {
  const isTelegramWebApp = !!getTelegramWebApp();
  const needsBottomPadding = showBottomNav && isTelegramWebApp && !fullScreen;

  useEffect(() => {
    document.body.classList.add('screen-layout-active');
    return () => {
      document.body.classList.remove('screen-layout-active');
    };
  }, []);

  return (
    <div 
      className={`screen-layout-root ${fullScreen ? 'screen-fullscreen' : ''}`}
      data-testid="screen-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: fullScreen ? '#000' : '#FFFFFF',
      }}
    >
      {header && (
        <header 
          className="screen-layout-header"
          data-testid="screen-header"
          style={{
            flexShrink: 0,
            background: '#FFFFFF',
            zIndex: 10,
          }}
        >
          {header}
        </header>
      )}

      <main 
        className={`screen-layout-content ${contentClassName}`}
        data-testid="screen-content"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: fullScreen ? 'hidden' : 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: needsBottomPadding 
            ? 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px))' 
            : noPadding || fullScreen ? '0' : '16px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
