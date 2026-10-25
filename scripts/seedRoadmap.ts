import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { RoadmapProject } from '../models/RoadmapProject';
import { roadmapData } from '../app/roadmap/data';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment!');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing data
    await RoadmapProject.deleteMany({});
    console.log('Cleared existing bloated/duplicate roadmap projects');

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

    const total = await RoadmapProject.countDocuments();
    console.log(`Successfully seeded ${total} curated Injaazh Product & SaaS Roadmap projects!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
