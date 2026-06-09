import mongoose from 'mongoose';
import { RoadmapProject } from '../models/RoadmapProject';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://injaazhos:rXfVzMOVEz2gD7Jx@injaazh-os.kerqqku.mongodb.net/injaazh_os?retryWrites=true&w=majority&appName=Injaazh-OS";

const data = [
  {
    category: "Core Business Systems",
    projects: [
      { name: "Full ERP System with AI Templates", status: "In Progress" },
      { name: "LMS (Learning Management System)", status: "In Progress" },
      { name: "HRM (Human Resource Management)", status: "In Progress" },
      { name: "CRM (Customer Relationship Management)", status: "Planning" },
      { name: "POS (Point of Sale)", status: "In Progress" },
      { name: "Inventory Management System", status: "Planning" },
      { name: "Billing & Invoice SaaS", status: "Planning" },
      { name: "Accounting Software", status: "Planning" },
      { name: "Payroll Management System", status: "Planning" },
      { name: "Procurement & Vendor Management System", status: "Planning" },
      { name: "Asset Management System", status: "Planning" },
      { name: "Document Management System", status: "Planning" },
      { name: "Digital Signature Workflow Platform", status: "Planning" },
      { name: "Business Intelligence Dashboard", status: "Planning" },
      { name: "AI Data Analytics Platform", status: "Planning" },
      { name: "SaaS Boilerplate (Backend + Frontend)", status: "In Progress" },
    ]
  },
  {
    category: "Healthcare Ecosystem",
    projects: [
      { name: "Medical & Doctor Appointment Management", status: "In Progress" },
      { name: "Hospital Management System (Full HMS)", status: "Planning" },
      { name: "Doctor Appointment & Queue Management", status: "Planning" },
      { name: "Clinic Management System", status: "Planning" },
      { name: "Diagnostic Center Management System", status: "Planning" },
      { name: "Pharmacy Inventory & Prescription Tool", status: "Planning" },
      { name: "Elderly Medicine Reminder & Family Monitoring", status: "Planning" },
      { name: "Telemedicine Platform", status: "Planning" },
      { name: "Smart Clinic Ecosystem", status: "Planning" },
      { name: "Laboratory Information Management System (LIMS)", status: "Planning" },
      { name: "Patient Portal System", status: "Planning" },
      { name: "Electronic Medical Records (EMR)", status: "Planning" },
      { name: "Healthcare Billing Management", status: "Planning" },
    ]
  },
  {
    category: "Education Systems",
    projects: [
      { name: "School Management System", status: "Planning" },
      { name: "College Management System", status: "Planning" },
      { name: "University Management System", status: "Planning" },
      { name: "Coaching Center Management", status: "Planning" },
      { name: "Online Examination Platform", status: "Planning" },
      { name: "Student Information System (SIS)", status: "Planning" },
      { name: "Attendance Management System", status: "Planning" },
      { name: "Parent Communication Platform", status: "Planning" }
    ]
  },
  {
    category: "Real Estate & Construction",
    projects: [
      { name: "Real Estate CRM", status: "Planning" },
      { name: "Property Management System", status: "Planning" },
      { name: "Construction Project Management ERP", status: "Planning" },
      { name: "Contractor Management System", status: "Planning" },
      { name: "Property Booking Platform", status: "Planning" },
      { name: "Rental Management Software", status: "Planning" },
      { name: "Facility Management System", status: "Planning" }
    ]
  },
  {
    category: "Finance & Business",
    projects: [
      { name: "Loan Management System", status: "Planning" },
      { name: "Microfinance Management Software", status: "Planning" },
      { name: "Tax & VAT Management Software", status: "Planning" },
      { name: "Subscription Billing Platform", status: "Planning" },
      { name: "Expense Tracking System", status: "Planning" },
      { name: "Financial Reporting Platform", status: "Planning" },
      { name: "Investment Portfolio Tracker", status: "Planning" },
      { name: "Trading Website with Complete Features", status: "Planning" }
    ]
  },
  {
    category: "E-commerce & Retail",
    projects: [
      { name: "WooCommerce Smart Helper Plugin", status: "Planning" },
      { name: "Multi-Vendor Marketplace SaaS", status: "Planning" },
      { name: "Warehouse Management System", status: "Planning" },
      { name: "Dropshipping Management Platform", status: "Planning" },
      { name: "Supplier & Wholesale Portal", status: "Planning" },
      { name: "E-commerce Analytics Dashboard", status: "Planning" },
      { name: "Product Information Management (PIM)", status: "Planning" },
      { name: "Order Management System", status: "Planning" }
    ]
  },
  {
    category: "Marketing & SEO",
    projects: [
      { name: "AI Website Audit Tool", status: "Planning" },
      { name: "SEO Agency Operating System", status: "Planning" },
      { name: "Rank Tracking Tool", status: "Planning" },
      { name: "Local SEO Audit Platform", status: "Planning" },
      { name: "Google Business Profile Management Tool", status: "Planning" },
      { name: "Lead Generation Automation Tool", status: "Planning" },
      { name: "Social Media Management Platform", status: "Planning" },
      { name: "Influencer Management Platform", status: "Planning" },
      { name: "Affiliate Tracking System", status: "Planning" },
      { name: "Email Marketing Automation Platform", status: "Planning" },
      { name: "SMS Marketing Platform", status: "Planning" },
      { name: "WhatsApp Marketing Platform", status: "Planning" }
    ]
  },
  {
    category: "AI Products",
    projects: [
      { name: "AI Content Generation Platform", status: "Planning" },
      { name: "AI Chatbot Builder for Businesses", status: "Planning" },
      { name: "AI Resume Builder", status: "Planning" },
      { name: "AI Interview Preparation Platform", status: "Planning" },
      { name: "AI Proposal Generator", status: "Planning" },
      { name: "AI Contract Generator", status: "Planning" },
      { name: "AI Meeting Notes Generator", status: "Planning" },
      { name: "AI Customer Support Assistant", status: "Planning" },
      { name: "AI Knowledge Base Assistant", status: "Planning" },
      { name: "AI Code Review Platform", status: "Planning" }
    ]
  },
  {
    category: "Freelancer & Agency Tools",
    projects: [
      { name: "Freelance Proposal Generator & Job Filter", status: "Planning" },
      { name: "Client Portal System", status: "Planning" },
      { name: "Agency Project Management Platform", status: "Planning" },
      { name: "Time Tracking Software", status: "Planning" },
      { name: "Team Productivity Dashboard", status: "Planning" },
      { name: "Resource Planning Software", status: "Planning" },
      { name: "Service Quotation Generator", status: "Planning" },
      { name: "Agency Reporting Dashboard", status: "Planning" }
    ]
  },
  {
    category: "Support & Operations",
    projects: [
      { name: "Help Desk SaaS", status: "Planning" },
      { name: "Customer Support Ticket System", status: "Planning" },
      { name: "Visitor Management System", status: "Planning" },
      { name: "Recruitment & Applicant Tracking System (ATS)", status: "Planning" },
      { name: "Employee Attendance System", status: "Planning" },
      { name: "Face Recognition Attendance Platform", status: "Planning" },
      { name: "Internal Communication Platform", status: "Planning" },
      { name: "Knowledge Base Platform", status: "Planning" }
    ]
  },
  {
    category: "Logistics & Transportation",
    projects: [
      { name: "Courier & Delivery Management System", status: "Planning" },
      { name: "Vehicle Fleet Management System", status: "Planning" },
      { name: "Route Optimization Platform", status: "Planning" },
      { name: "Logistics Tracking System", status: "Planning" },
      { name: "Transport Management System", status: "Planning" }
    ]
  },
  {
    category: "Hospitality & Events",
    projects: [
      { name: "Restaurant Management System", status: "Planning" },
      { name: "Hotel Management System", status: "Planning" },
      { name: "Resort Management System", status: "Planning" },
      { name: "Event Management Platform", status: "Planning" },
      { name: "Membership Management Platform", status: "Planning" },
      { name: "Community Management Platform", status: "Planning" }
    ]
  },
  {
    category: "Marketplace & Platforms",
    projects: [
      { name: "Appointment Booking Platform", status: "Planning" },
      { name: "Job Board Platform", status: "Planning" },
      { name: "Freelancer Marketplace", status: "Planning" },
      { name: "Service Marketplace Platform", status: "Planning" },
      { name: "Business Directory Platform", status: "Planning" },
      { name: "Vendor Marketplace", status: "Planning" }
    ]
  },
  {
    category: "Industry Specific Systems",
    projects: [
      { name: "Manufacturing ERP", status: "Planning" },
      { name: "Production Planning Software", status: "Planning" },
      { name: "Agriculture Farm Management System", status: "Planning" },
      { name: "Livestock Management Platform", status: "Planning" },
      { name: "Fisheries Management Software", status: "Planning" },
      { name: "NGO Management System", status: "Planning" },
      { name: "Legal Case Management Software", status: "Planning" },
      { name: "Insurance Management System", status: "Planning" },
      { name: "Automobile Workshop Management System", status: "Planning" },
      { name: "Gym & Fitness Center Management System", status: "Planning" }
    ]
  },
  {
    category: "Future High-Value Opportunities",
    projects: [
      { name: "Super App for SMEs", status: "Planning" },
      { name: "Unified Healthcare Ecosystem", status: "Planning" },
      { name: "Unified Business Operating System", status: "Planning" },
      { name: "AI Business Automation Platform", status: "Planning" },
      { name: "Vertical SaaS Ecosystem for Bangladesh SMEs", status: "Planning" }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await RoadmapProject.deleteMany({});
    console.log('Cleared existing roadmap projects');

    let orderIndex = 0;
    for (const category of data) {
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

    console.log('Successfully seeded 130 roadmap projects');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
