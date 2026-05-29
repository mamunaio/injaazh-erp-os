import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Settings | Injaazh ERP',
  description: 'Manage your agency settings and preferences.',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden font-sans tracking-tight">
      <SettingsClient />
    </div>
  );
}
