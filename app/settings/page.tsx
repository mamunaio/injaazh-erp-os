import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Settings | Injaazh ERP',
  description: 'Manage your agency settings and preferences.',
};

export default function SettingsPage() {
  return (
    <div className="bg-[#09090B] min-h-screen text-white overflow-hidden">
      <SettingsClient />
    </div>
  );
}
