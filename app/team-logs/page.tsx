import React from 'react';
import TeamLogsClient from './TeamLogsClient';
import { getCurrentUser } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';

export default async function TeamLogsPage() {
  const authRes = await getCurrentUser();
  if (!authRes.success || !authRes.data) {
    redirect('/login');
  }
  const user = authRes.data;

  // Pass user info (role, etc.) to the client component so we know if they can edit
  const serializedUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Team Logs</h1>
        <p className="text-slate-500">Track and monitor your team's daily productivity and active work hours.</p>
      </div>

      <TeamLogsClient currentUser={serializedUser} />
    </div>
  );
}
