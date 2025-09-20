export type ItemStatus = 'todo' | 'in-progress' | 'done';

export interface MvpItem {
  id: string;
  title: string;
  status: ItemStatus;
}

export interface MvpSection {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  items: MvpItem[];
}

export const mvpSections: MvpSection[] = [
  {
    id: 'p0',
    title: 'Critical stability and startup',
    priority: 'P0',
    items: [
      { id: 'boot-routing', title: 'App boot & routing stability', status: 'in-progress' },
      { id: 'error-boundary', title: 'Error boundary & crash visibility', status: 'todo' },
    ],
  },
  {
    id: 'p1',
    title: 'Core learning flow (MVP)',
    priority: 'P1',
    items: [
      { id: 'auth', title: 'Authentication (login/signup/logout)', status: 'in-progress' },
      { id: 'content-model', title: 'Content model (levels→lessons→quizzes)', status: 'done' },
      { id: 'courses-progress', title: 'Course listing with progress', status: 'in-progress' },
      { id: 'lesson-view', title: 'Lesson viewing & completion', status: 'in-progress' },
      { id: 'quiz-flow', title: 'Quiz flow and scoring', status: 'in-progress' },
      { id: 'profile', title: 'Profile summary', status: 'in-progress' },
    ],
  },
  {
    id: 'p2',
    title: 'Offline-first and sync',
    priority: 'P2',
    items: [
      { id: 'downloads', title: 'Download management', status: 'in-progress' },
      { id: 'offline-viewing', title: 'Offline viewing', status: 'in-progress' },
      { id: 'network-awareness', title: 'Network awareness', status: 'done' },
      { id: 'bubble-sync', title: 'Bubble sync (pull & push)', status: 'in-progress' },
    ],
  },
  {
    id: 'p3',
    title: 'Engagement and depth',
    priority: 'P3',
    items: [
      { id: 'certificates', title: 'Certificates', status: 'todo' },
      { id: 'jobs-board', title: 'Jobs board polish', status: 'in-progress' },
      { id: 'community', title: 'Community (read-only)', status: 'todo' },
      { id: 'settings', title: 'Settings panel', status: 'todo' },
    ],
  },
  {
    id: 'p4',
    title: 'Quality, polish, and scale',
    priority: 'P4',
    items: [
      { id: 'a11y', title: 'Accessibility (a11y)', status: 'todo' },
      { id: 'theming', title: 'Theming and UI consistency', status: 'in-progress' },
      { id: 'analytics', title: 'Analytics/diagnostics', status: 'todo' },
      { id: 'tests', title: 'Automated tests', status: 'todo' },
      { id: 'performance', title: 'Performance and bundle hygiene', status: 'in-progress' },
    ],
  },
];
