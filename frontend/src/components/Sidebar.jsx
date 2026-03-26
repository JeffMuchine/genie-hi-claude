import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Briefcase, User, LogOut, ChevronRight, BarChart2, FileText } from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'apply',
    label: 'Apply',
    icon: Briefcase,
    disabled: false,
  },
  {
    id: 'resume-builder',
    label: 'Resume Builder',
    icon: FileText,
    disabled: true,
    badge: 'WIP',
  },
  {
    id: 'job-insights',
    label: 'Job Insights',
    icon: BarChart2,
    disabled: true,
    badge: 'WIP',
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
    disabled: false,
  },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  const width = collapsed ? 64 : 220;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width,
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: collapsed ? '18px 0' : '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {/* G icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6F38C5, #87A2FB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>G</span>
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
              Genie-Hi
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>AI Job Co-pilot</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon, disabled, badge }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => {
                if (!disabled) onTabChange(id);
              }}
              disabled={disabled}
              title={collapsed ? label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                border: 'none',
                background: isActive ? '#ede6fc' : 'transparent',
                color: isActive ? '#6F38C5' : disabled ? '#c4c4c4' : '#6b7280',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                opacity: disabled ? 0.55 : 1,
                position: 'relative',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isActive) {
                  e.currentTarget.style.background = '#f3eeff';
                  e.currentTarget.style.color = '#6F38C5';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  {badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: '#f3f4f6',
                        color: '#9ca3af',
                        padding: '2px 6px',
                        borderRadius: 4,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: collapse toggle + sign out */}
      <div
        style={{
          padding: '8px',
          borderTop: '1px solid #f3f4f6',
          flexShrink: 0,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
            marginBottom: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#6F38C5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          <ChevronRight
            size={16}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.25s',
            }}
          />
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff1f1';
            e.currentTarget.style.color = '#FF5555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
