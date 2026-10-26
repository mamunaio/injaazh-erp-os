'use server';

import connectToDatabase from '@/lib/mongodb';
import { RoadmapProject } from '@/models/RoadmapProject';
import { roadmapData } from '@/app/roadmap/data';
import { revalidatePath } from 'next/cache';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';

export async function getRoadmapProjects() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await connectToDatabase();
    const projects = await RoadmapProject.find().sort({ orderIndex: 1, createdAt: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(projects)) };
  } catch (error: any) {
    console.error('Failed to fetch roadmap projects:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createRoadmapProject(data: {
  title: string;
  category: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
}) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    const count = await RoadmapProject.countDocuments();
    const created = await RoadmapProject.create({
      title: data.title.trim(),
      category: data.category.trim(),
      status: data.status,
      orderIndex: count,
      logs: []
    });
    revalidatePath('/roadmap');
    return { success: true, data: JSON.parse(JSON.stringify(created)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectStatus(id: string, status: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await RoadmapProject.findByIdAndUpdate(id, { status });
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRoadmapProject(
  id: string,
  updates: {
    title?: string;
    category?: string;
    status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  }
) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    const updated = await RoadmapProject.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    revalidatePath('/roadmap');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRoadmapProject(id: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await RoadmapProject.findByIdAndDelete(id);
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addProjectLog(id: string, text: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    const updated = await RoadmapProject.findByIdAndUpdate(
      id,
      {
        $push: { logs: { text: text.trim(), completed: false, date: new Date() } }
      },
      { new: true }
    ).lean();
    revalidatePath('/roadmap');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleLogCompletion(projectId: string, logId: string, completed: boolean) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await RoadmapProject.updateOne(
      { _id: projectId, 'logs._id': logId },
      { $set: { 'logs.$.completed': completed } }
    );
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProjectLog(projectId: string, logId: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await RoadmapProject.findByIdAndUpdate(projectId, {
      $pull: { logs: { _id: logId } }
    });
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetRoadmapToCurated() {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await RoadmapProject.deleteMany({});

    let orderIndex = 0;
    for (const category of roadmapData) {
      for (const project of category.projects) {
        await RoadmapProject.create({
          title: project.name,
          category: category.category,
          status: project.status as any,
          orderIndex: orderIndex++,
          logs: (project.logs || []).map(l => ({
            text: l.text,
            completed: l.completed,
            date: new Date()
          }))
        });
      }
    }

    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
