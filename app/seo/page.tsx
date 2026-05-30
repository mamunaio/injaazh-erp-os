import SeoClient from './SeoClient';
import { getSeoProjects } from '@/app/actions/seoActions';

export const metadata = {
  title: 'SEO & AEO Tracker | Injaazh ERP',
  description: 'Next-Gen SEO and Answer Engine Optimization tracking.',
};

export default async function SeoPage() {
  const result = await getSeoProjects();
  const projects = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden font-sans tracking-tight">
      <SeoClient initialProjects={projects} />
    </div>
  );
}
