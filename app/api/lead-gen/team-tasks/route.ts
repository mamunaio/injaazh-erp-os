import { NextResponse } from 'next/server';
import { getTeamTasks, createTeamTask } from '@/lib/leadGenStore';

export async function GET() {
  try {
    const tasks = await getTeamTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTask = await createTeamTask(body);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
