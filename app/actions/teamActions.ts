'use server';

import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

// Middleware helper to check if logged in user is admin
async function requireAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthorized. Admin access required.');
  }
  await connectToDatabase();
  const dbUser = await User.findById(authUser.id);
  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'owner')) {
    throw new Error('Unauthorized. Admin access required.');
  }
  return authUser;
}

// Middleware helper to check if user is logged in
async function requireAuth() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Not authenticated.');
  }
  return authUser;
}

export async function getTeamMembers() {
  try {
    await requireAdmin();
    await connectToDatabase();
    
    const members = await User.find({ role: { $in: ['admin', 'editor', 'marketplace_team', 'team_member'] } }).select('-password').sort({ createdAt: -1 }).lean();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(members))
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch team members' };
  }
}

export async function createTeamMember(data: { name: string; email: string; password?: string; role: string }) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { name, email, password, role } = data;

    if (!name || !email || !password) {
      return { success: false, error: 'Name, email and password are required' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' };
    }

    const newMember = await User.create({
      name,
      email,
      password,
      role: role || 'editor',
      permissions: []
    });

    return {
      success: true,
      data: {
        id: newMember._id.toString(),
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        permissions: newMember.permissions
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create team member' };
  }
}

export async function updateTeamMemberRole(memberId: string, role: string) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const member = await User.findById(memberId);
    if (!member) {
      return { success: false, error: 'Team member not found' };
    }

    member.role = role;
    await member.save();

    return {
      success: true,
      data: {
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update permissions' };
  }
}

export async function deleteTeamMember(memberId: string) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const member = await User.findById(memberId);
    if (!member || member.role !== 'team_member') {
      return { success: false, error: 'Team member not found' };
    }

    await User.findByIdAndDelete(memberId);
    return { success: true, message: 'Team member removed successfully' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to remove team member' };
  }
}

export async function updateUserProfile(data: {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  image?: string;
}) {
  try {
    const authUser = await requireAuth();
    await connectToDatabase();

    const { name, email, currentPassword, newPassword, image } = data;

    if (!name || !email) {
      return { success: false, error: 'Name and email are required' };
    }

    const user = await User.findById(authUser.id).select('+password');
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if email already in use by another user
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return { success: false, error: 'Email is already in use by another account' };
      }
      user.email = email.toLowerCase();
    }

    user.name = name;
    if (image !== undefined) {
      user.image = image;
    }

    // Handle password update if requested
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return { success: false, error: 'Current password is incorrect' };
      }
      if (newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long' };
      }
      user.password = newPassword;
    } else if (newPassword && !currentPassword) {
      return { success: false, error: 'You must provide your current password to set a new one' };
    }

    await user.save();

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}
