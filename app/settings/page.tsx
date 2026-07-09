import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Settings | Injaazh ERP',
  description: 'Manage your agency settings and preferences.',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-200 overflow-hidden font-sans tracking-tight">
      <SettingsClient />
    </div>
  );
}
