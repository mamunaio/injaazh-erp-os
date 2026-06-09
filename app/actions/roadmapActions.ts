'use server';

import connectToDatabase from '@/lib/mongodb';
import { RoadmapProject } from '@/models/RoadmapProject';
import { revalidatePath } from 'next/cache';

export async function getRoadmapProjects() {
  try {
    await connectToDatabase();
    const projects = await RoadmapProject.find().sort({ orderIndex: 1, createdAt: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(projects)) };
  } catch (error: any) {
    console.error('Failed to fetch roadmap projects:', error);
    return { success: false, error: error.message };
  }
}

export async function createRoadmapProject(data: { title: string; category: string; status: string }) {
  try {
    await connectToDatabase();
    const count = await RoadmapProject.countDocuments({ category: data.category });
    await RoadmapProject.create({
      title: data.title,
      category: data.category,
      status: data.status,
      orderIndex: count,
      logs: []
    });
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectStatus(id: string, status: string) {
  try {
    await connectToDatabase();
    await RoadmapProject.findByIdAndUpdate(id, { status });
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addProjectLog(id: string, text: string) {
  try {
    await connectToDatabase();
    await RoadmapProject.findByIdAndUpdate(id, {
      $push: { logs: { text, completed: true, date: new Date() } }
    });
    revalidatePath('/roadmap');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleLogCompletion(projectId: string, logId: string, completed: boolean) {
  try {
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
