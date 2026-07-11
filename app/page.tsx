import { getCurrentUser } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';
import WelcomeClient from './WelcomeClient';

export default async function WelcomePage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }

  return <WelcomeClient />;
}
