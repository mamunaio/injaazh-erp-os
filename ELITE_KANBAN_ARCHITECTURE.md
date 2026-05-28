# Elite Kanban Architecture Documentation

## Overview
This document describes the production-ready Kanban system implemented for the Project Delivery module. The architecture combines intuitive empty states with high-density data cards and flawless drag-and-drop functionality using `@dnd-kit`.

## Architecture Components

### 1. Type Definitions (`types/kanban.ts`)
Defines the core data structures:
- **ProjectCard**: Represents a project card with all necessary fields
- **Column**: Represents a Kanban column with its cards
- **Assignee**: Team member information
- **ProjectStatus**: Type-safe status values ('Planning', 'In Progress', 'In Review', 'Completed')
- **DragState**: Tracks drag-and-drop state

### 2. Board Context (`components/Kanban/BoardContext.tsx`)
Central state management for the Kanban board:
- **DndContext**: Manages drag-and-drop with `@dnd-kit/core`
- **Sensors**: Pointer and Keyboard sensors with 8px activation distance
- **Drag Handlers**:
  - `onDragStart`: Captures the active card
  - `onDragOver`: Provides optimistic UI updates during drag
  - `onDragEnd`: Persists changes to the server
- **State Management**:
  - `columns`: Current state of all columns and cards
  - `activeCard`: Currently dragged card
  - `addProject`: Creates new project in a column
  - `updateCard`: Updates card properties
  - `onCardClick`: Optional callback for card clicks

### 3. Column Component (`components/Kanban/Column.tsx`)
Represents a single Kanban column:
- **Fixed Width**: `w-80` for consistent layout
- **Header Section**:
  - Colored status dot (blue, orange, fuchsia, green)
  - Column title
  - Count pill showing number of cards
  - Add button (+) for creating new projects
- **Droppable Area**: Uses `useDroppable` hook
- **Visual Feedback**: Highlights when dragging over
- **SortableContext**: Manages card sorting within column

### 4. Card Component (`components/Kanban/Card.tsx`)
High-density project card with:
- **Tech Tags**: Color-coded technology badges (LARAVEL, NEXT.JS, etc.)
- **Project Title**: Clickable to open edit modal
- **Progress Bar**: Visual progress indicator (0-100%)
- **Due Date**: Shows urgency with color coding
  - Red: Overdue, Today, Tomorrow, or < 2 days
  - Gray: Normal timeline
- **Assignees**: Avatar group with overlap effect
- **Drag Handle**: Entire card is draggable
- **Click Handler**: Opens edit modal when clicked

### 5. Empty State (`components/Kanban/EmptyState.tsx`)
Hybrid empty state for columns with no cards:
- **Dashed Border**: Visual dropzone indicator
- **Plus Icon**: Centered in purple square
- **Hover Effects**: Highlights on hover
- **Click to Add**: Creates new project in column

### 6. Kanban Board (`components/Kanban/KanbanBoard.tsx`)
Main integration component:
- **Data Mapping**: Converts database projects to Kanban cards
- **Column Initialization**: Sets up 4 columns with proper configuration
- **Props**:
  - `initialProjects`: Array of projects from database
  - `onCardClick`: Callback for card click events
- **Responsive**: Horizontal scroll with snap points

## Data Flow

### 1. Initial Load
```
Database → getProjectsBoard() → ProjectsClient → KanbanBoard → BoardProvider → Columns → Cards
```

### 2. Drag & Drop
```
User drags card → onDragStart (capture) → onDragOver (optimistic update) → onDragEnd (server update)
```

### 3. Card Click
```
User clicks card → onCardClick callback → ProjectsClient → Opens EditProjectModal
```

### 4. Add Project
```
User clicks + button → addProject() → Creates temp card → Opens for inline editing
```

## Column Configuration

### Planning (Blue)
- Color: `from-blue-500 to-cyan-500`
- Dot: Blue gradient
- Purpose: Initial project planning phase

### In Progress (Orange)
- Color: `from-yellow-500 to-orange-500`
- Dot: Orange gradient
- Purpose: Active development

### In Review (Fuchsia)
- Color: `from-purple-500 to-fuchsia-500`
- Dot: Fuchsia gradient
- Purpose: Quality assurance and review

### Completed (Green)
- Color: `from-green-500 to-emerald-500`
- Dot: Green gradient
- Purpose: Finished projects

## Tech Stack Colors

Predefined colors for common technologies:
- **LARAVEL**: Red
- **NEXT.JS**: Slate
- **WORDPRESS**: Blue
- **SEO**: Green
- **UI/UX**: Purple
- **REACT**: Cyan
- **NODE.JS**: Emerald
- **PYTHON**: Yellow

## Features

### ✅ Implemented
- [x] Drag & drop between columns
- [x] Optimistic UI updates
- [x] Server-side persistence
- [x] Click to edit cards
- [x] High-density card design
- [x] Progress bars
- [x] Tech tag badges
- [x] Due date indicators
- [x] Assignee avatars
- [x] Empty state with add button
- [x] Column headers with counts
- [x] Responsive layout
- [x] Dark mode support
- [x] Smooth animations
- [x] Zero hydration errors

### 🚧 Future Enhancements
- [ ] Inline title editing for new cards
- [ ] Card filtering and search
- [ ] Bulk operations
- [ ] Card templates
- [ ] Custom column creation
- [ ] Card archiving
- [ ] Activity timeline
- [ ] Real-time collaboration

## Performance Optimizations

1. **Optimistic Updates**: UI updates immediately before server confirmation
2. **Memoization**: Uses `useMemo` and `useCallback` to prevent unnecessary re-renders
3. **Lazy Loading**: Cards render only when visible
4. **Efficient Serialization**: Manual serialization in `getProjectsBoard()` to handle MongoDB ObjectIds
5. **Activation Distance**: 8px drag threshold prevents accidental drags

## Error Handling

1. **Drag Failures**: Reverts to initial state on server error
2. **Network Issues**: Shows alert and maintains local state
3. **Invalid Data**: Graceful fallbacks for missing fields
4. **Hydration**: Uses `suppressHydrationWarning` where needed

## Accessibility

1. **Keyboard Navigation**: Full keyboard support via KeyboardSensor
2. **ARIA Labels**: Proper button labels and roles
3. **Focus Management**: Maintains focus during drag operations
4. **Screen Readers**: Semantic HTML structure

## Integration Guide

### Using the Kanban Board

```tsx
import KanbanBoard from '@/components/Kanban/KanbanBoard';

function MyComponent({ projects }) {
  const handleCardClick = (projectId: string) => {
    // Handle card click (e.g., open edit modal)
  };

  return (
    <KanbanBoard 
      initialProjects={projects}
      onCardClick={handleCardClick}
    />
  );
}
```

### Customizing Columns

Edit `KanbanBoard.tsx` to modify column configuration:

```tsx
const initialColumns: ColumnType[] = [
  {
    id: 'Planning',
    title: 'Planning',
    color: 'from-blue-500 to-cyan-500',
    dotColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    cards: cards.filter((c) => c.status === 'Planning'),
  },
  // Add more columns...
];
```

## Troubleshooting

### Cards Not Dragging
- Check that `@dnd-kit` packages are installed
- Verify activation distance is set (8px)
- Ensure cards have unique IDs

### Hydration Errors
- Use `suppressHydrationWarning` on dynamic content
- Ensure server and client render the same initial state

### State Not Updating
- Check that `revalidatePath` is called after mutations
- Verify `useEffect` dependencies in `KanbanBoard`
- Ensure `initialProjects` prop is updated after server actions

## File Structure

```
components/Kanban/
├── index.ts              # Barrel export
├── BoardContext.tsx      # State management & DnD context
├── Column.tsx            # Column component
├── Card.tsx              # Card component
├── EmptyState.tsx        # Empty state component
└── KanbanBoard.tsx       # Main integration component

types/
└── kanban.ts             # Type definitions

app/projects/
├── page.tsx              # Server component (data fetching)
├── ProjectsClient.tsx    # Client component (UI & interactions)
└── ProjectBoard.tsx      # Legacy board (can be removed)
```

## Migration Notes

The new Kanban system replaces the old `ProjectBoard.tsx` implementation. Key differences:

1. **Separation of Concerns**: Logic split into focused components
2. **Type Safety**: Full TypeScript support with strict types
3. **Better UX**: Click to edit, better empty states, smoother animations
4. **Maintainability**: Cleaner code structure, easier to extend
5. **Performance**: Optimized rendering and state management

## Credits

Built with:
- **@dnd-kit**: Modern drag-and-drop library
- **Next.js 15**: React framework
- **Tailwind CSS**: Utility-first CSS
- **TypeScript**: Type safety
- **Framer Motion**: Smooth animations (in parent components)

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
