import mongoose from 'mongoose';
import { RoadmapProject } from '../models/RoadmapProject';
import { roadmapData } from '../app/roadmap/data';

// Replace with your MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://injaazhos:rXfVzMOVEz2gD7Jx@injaazh-os.kerqqku.mongodb.net/injaazh_os?retryWrites=true&w=majority&appName=Injaazh-OS";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Optional: Clear existing data
    await RoadmapProject.deleteMany({});
    console.log('Cleared existing roadmap projects');

    let orderIndex = 0;
    for (const category of roadmapData) {
      for (const project of category.projects) {
        await RoadmapProject.create({
          title: project.name,
          category: category.category,
          status: project.status,
          orderIndex: orderIndex++,
          logs: []
        });
      }
    }

    console.log('Successfully seeded roadmap projects');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
