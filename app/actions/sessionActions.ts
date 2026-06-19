'use server';

import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function getActiveSessions() {
  try {
    await connectToDatabase();
    
    // getAuthUser now validates the session against DB and returns payload
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const sessions = await Session.find({ 
      userId: authUser.id,
      isValid: true 
    }).sort({ lastActive: -1 });

    const formattedSessions = sessions.map(session => ({
      _id: session._id.toString(),
      sessionId: session.sessionId,
      device: session.device,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
      location: session.ip === '::1' || session.ip === '127.0.0.1' ? 'Localhost' : 'Unknown Location',
      lastActive: session.lastActive,
      isCurrent: authUser.sessionId === session.sessionId
    }));

    return { success: true, sessions: formattedSessions };
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return { success: false, error: error.message || 'Failed to fetch sessions' };
  }
}

export async function revokeSession(sessionIdToRevoke: string) {
  try {
    await connectToDatabase();
    
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Don't allow revoking the current session through this specific endpoint 
    // (use logout for that)
    if (authUser.sessionId === sessionIdToRevoke) {
      return { success: false, error: 'Cannot revoke your current session. Use logout instead.' };
    }

    const result = await Session.findOneAndUpdate(
      { sessionId: sessionIdToRevoke, userId: authUser.id },
      { isValid: false }
    );

    if (!result) {
      return { success: false, error: 'Session not found' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return { success: false, error: error.message || 'Failed to revoke session' };
  }
}
