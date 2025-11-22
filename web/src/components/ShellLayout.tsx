import { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Templates', to: '/' },
  { label: 'Runs', to: '/runs' }
];

export function ShellLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Process Ave</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

