export type ProjectStatus = 'Planning' | 'In Progress' | 'In Review' | 'Completed';

export interface Assignee {
  name: string;
  avatarUrl: string;
}

export interface ProjectCard {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number; // 0-100
  tags: string[];
  dueDate: string; // ISO date string
  assignees: Assignee[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: ProjectStatus;
  title: string;
  color: string;
  dotColor: string;
  cards: ProjectCard[];
}

export interface DragState {
  activeId: string | null;
  overId: string | null;
}
