// User types and interfaces for GroupForge AI

import { SkillProfile, AssessmentRecord } from './assessment';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    institutionId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentProfile extends User {
    role: 'student';
    enrollmentNumber?: string;
    department?: string;
    year?: number;
    skills: SkillProfile;
    assessmentHistory: AssessmentRecord[];
    githubConnected: boolean;
    githubUsername?: string;
    resumeUploaded: boolean;
    teamAssignments: string[]; // Team IDs
}

export interface FacultyProfile extends User {
    role: 'faculty';
    employeeId?: string;
    department?: string;
    coursesManaged: string[]; // Course IDs
}

export interface AdminProfile extends User {
    role: 'admin';
    permissions: AdminPermission[];
}

export type AdminPermission =
    | 'manage_users'
    | 'manage_courses'
    | 'manage_institutions'
    | 'view_analytics'
    | 'configure_assessments';
