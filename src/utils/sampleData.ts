import { Project, Collaborator } from '../types/project';

export const sampleCollaborators: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'John Designer',
    nickname: 'John',
    role: 'UI Designer'
  },
  {
    id: 'collab-2',
    name: 'Sarah Developer',
    nickname: 'Sarah',
    role: 'Frontend Developer'
  }
];

export const sampleVerticals: string[] = ['Web Design', 'Mobile App', 'Marketing'];

export const sampleProjects: Project[] = [
  {
    id: 'project-1',
    project_name: 'Mobile App Redesign',
    vertical: 'Mobile App',
    type: 'Spot',
    types: ['Spot', 'Icon'],
    status: 'In Progress',
    notes: 'Redesigning the main mobile application interface',
    start_date: '2025-01-15',
    due_date: '2025-03-20',
    links: {
      figma: 'https://figma.com/file/sample',
      docs: 'https://docs.google.com/sample'
    },
    collaborators: [
      { id: 'collab-1', name: 'John Designer', nickname: 'John', role: 'UI Designer' }
    ],
    sprint: 'Sprint 1',
    tags: ['design', 'mobile', 'ui'],
    actionable_items: [
      {
        id: 'task-1',
        title: 'Create wireframes',
        is_completed: true,
        created_at: '2025-01-15',
        updated_at: '2025-01-16'
      },
      {
        id: 'task-2',
        title: 'Design high-fi mockups',
        is_completed: false,
        created_at: '2025-01-17',
        updated_at: '2025-01-17'
      }
    ],
    is_draft: true, // DRAFT PROJECT - for testing draft feature
    created_at: '2025-01-15',
    updated_at: '2025-01-15'
  },
  {
    id: 'project-2',
    project_name: 'Website Banner Campaign',
    vertical: 'Marketing',
    type: 'Banner',
    types: ['Banner'],
    status: 'Done',
    notes: 'Creating promotional banners for the new product launch',
    start_date: '2025-01-01',
    due_date: '2025-01-31',
    links: {
      figma: 'https://figma.com/file/banner'
    },
    collaborators: [
      { id: 'collab-1', name: 'John Designer', nickname: 'John', role: 'UI Designer' },
      { id: 'collab-2', name: 'Sarah Developer', nickname: 'Sarah', role: 'Frontend Developer' }
    ],
    tags: ['marketing', 'banner', 'campaign'],
    actionable_items: [
      {
        id: 'task-3',
        title: 'Research competitor banners',
        is_completed: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-02'
      },
      {
        id: 'task-4', 
        title: 'Create banner concepts',
        is_completed: true,
        created_at: '2025-01-03',
        updated_at: '2025-01-05'
      },
      {
        id: 'task-5',
        title: 'Get client approval',
        is_completed: false,
        created_at: '2025-01-10',
        updated_at: '2025-01-10'
      }
    ],
    created_at: '2025-01-01',
    updated_at: '2025-01-31'
  },
  {
    id: 'project-3',
    project_name: 'Custom Illustration Test',
    vertical: 'Marketing',
    type: 'Custom Type',
    types: ['Custom Type', 'Icon'],
    status: 'Not Started',
    notes: 'Testing custom illustration types management',
    start_date: '2025-02-01',
    due_date: '2025-02-28',
    links: {
      figma: 'https://figma.com/file/custom-test'
    },
    collaborators: [
      { id: 'collab-1', name: 'John Designer', nickname: 'John', role: 'UI Designer' }
    ],
    tags: ['test', 'custom', 'illustration'],
    actionable_items: [
      {
        id: 'task-6',
        title: 'Test custom type functionality',
        is_completed: false,
        created_at: '2025-02-01',
        updated_at: '2025-02-01'
      }
    ],
    created_at: '2025-02-01',
    updated_at: '2025-02-01'
  }
];

export async function initializeSampleData() {
  try {
    console.log('Sample data initialized for testing');
    return { sampleProjects, sampleCollaborators };
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return { sampleProjects: [], sampleCollaborators: [] };
  }
}