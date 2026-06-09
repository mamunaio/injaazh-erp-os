export type ProjectStatus = 'In Progress' | 'Planning' | 'Completed' | 'On Hold';

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
}

export interface RoadmapCategory {
  category: string;
  projects: Project[];
}

export const roadmapData: RoadmapCategory[] = [
  {
    category: "Core Business Systems",
    projects: [
      { id: 1, name: "Full ERP System with AI Templates", status: "In Progress" },
      { id: 2, name: "LMS (Learning Management System)", status: "In Progress" },
      { id: 3, name: "HRM (Human Resource Management)", status: "In Progress" },
      { id: 4, name: "CRM (Customer Relationship Management)", status: "Planning" },
      { id: 5, name: "POS (Point of Sale)", status: "In Progress" },
      { id: 6, name: "Inventory Management System", status: "Planning" },
      { id: 7, name: "Billing & Invoice SaaS", status: "Planning" },
      { id: 8, name: "Accounting Software", status: "Planning" },
      { id: 9, name: "Payroll Management System", status: "Planning" },
      { id: 10, name: "Procurement & Vendor Management System", status: "Planning" },
      { id: 11, name: "Asset Management System", status: "Planning" },
      { id: 12, name: "Document Management System", status: "Planning" },
      { id: 13, name: "Digital Signature Workflow Platform", status: "Planning" },
      { id: 14, name: "Business Intelligence Dashboard", status: "Planning" },
      { id: 15, name: "AI Data Analytics Platform", status: "Planning" },
      { id: 16, name: "SaaS Boilerplate (Backend + Frontend)", status: "In Progress" },
    ]
  },
  {
    category: "Healthcare Ecosystem",
    projects: [
      { id: 17, name: "Medical & Doctor Appointment Management", status: "In Progress" },
      { id: 18, name: "Hospital Management System (Full HMS)", status: "Planning" },
      { id: 19, name: "Doctor Appointment & Queue Management", status: "Planning" },
      { id: 20, name: "Clinic Management System", status: "Planning" },
      { id: 21, name: "Diagnostic Center Management System", status: "Planning" },
      { id: 22, name: "Pharmacy Inventory & Prescription Tool", status: "Planning" },
      { id: 23, name: "Elderly Medicine Reminder & Family Monitoring", status: "Planning" },
      { id: 24, name: "Telemedicine Platform", status: "Planning" },
      { id: 25, name: "Smart Clinic Ecosystem", status: "Planning" },
      { id: 26, name: "Laboratory Information Management System (LIMS)", status: "Planning" },
      { id: 27, name: "Patient Portal System", status: "Planning" },
      { id: 28, name: "Electronic Medical Records (EMR)", status: "Planning" },
      { id: 29, name: "Healthcare Billing Management", status: "Planning" },
    ]
  },
  {
    category: "Education Systems",
    projects: [
      { id: 30, name: "School Management System", status: "Planning" },
      { id: 31, name: "College Management System", status: "Planning" },
      { id: 32, name: "University Management System", status: "Planning" },
      { id: 33, name: "Coaching Center Management", status: "Planning" },
      { id: 34, name: "Online Examination Platform", status: "Planning" },
      { id: 35, name: "Student Information System (SIS)", status: "Planning" },
    ]
  }
];
