import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, Input } from '../components/ui';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    User,
    Mail,
    Building2,
    GraduationCap,
    Github,
    Save,
    Edit2,
    X,
    CheckCircle
} from 'lucide-react';
import { StudentProfile, FacultyProfile } from '../types';

interface ProfileFormData {
    displayName: string;
    department: string;
    enrollmentNumber?: string;
    year?: number;
    employeeId?: string;
    githubUsername?: string;
    institutionId: string;
}

export function ProfilePage() {
    const { currentUser, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '',
        department: '',
        enrollmentNumber: '',
        year: undefined,
        employeeId: '',
        githubUsername: '',
        institutionId: '',
    });

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (userProfile) {
            // Check if this is a new user (no department set)
            const isNew = !userProfile.institutionId || userProfile.institutionId === '';
            setIsNewUser(isNew);
            setIsEditing(isNew);

            // Populate form with existing data
            setFormData({
                displayName: userProfile.displayName || '',
                department: (userProfile as StudentProfile | FacultyProfile).department || '',
                enrollmentNumber: (userProfile as StudentProfile).enrollmentNumber || '',
                year: (userProfile as StudentProfile).year || undefined,
                employeeId: (userProfile as FacultyProfile).employeeId || '',
                githubUsername: (userProfile as StudentProfile).githubUsername || '',
                institutionId: userProfile.institutionId || '',
            });
        } else if (currentUser) {
            // User is logged in but profile not loaded yet - set as new user
            setIsNewUser(true);
            setIsEditing(true);
            setFormData(prev => ({
                ...prev,
                displayName: currentUser.displayName || '',
            }));
        }
    }, [currentUser, userProfile, navigate, authLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'year' ? (value ? parseInt(value) : undefined) : value
        }));
    };

    const handleSave = async () => {
        if (!currentUser) return;

        // Validate required fields
        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return;
        }
        if (!formData.institutionId.trim()) {
            setError('Institution is required');
            return;
        }
        if (!formData.department.trim()) {
            setError('Department is required');
            return;
        }

        setError('');
        setSaving(true);

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userRole = userProfile?.role || 'student';

            const updateData: Partial<StudentProfile | FacultyProfile> = {
                displayName: formData.displayName,
                institutionId: formData.institutionId,
                department: formData.department,
                updatedAt: new Date(),
            };

            if (userRole === 'student') {
                if (formData.enrollmentNumber) {
                    (updateData as Partial<StudentProfile>).enrollmentNumber = formData.enrollmentNumber;
                }
                if (formData.year) {
                    (updateData as Partial<StudentProfile>).year = formData.year;
                }
                if (formData.githubUsername) {
                    (updateData as Partial<StudentProfile>).githubUsername = formData.githubUsername;
                    (updateData as Partial<StudentProfile>).githubConnected = true;
                }
            } else if (userRole === 'faculty') {
                if (formData.employeeId) {
                    (updateData as Partial<FacultyProfile>).employeeId = formData.employeeId;
                }
            }

            await updateDoc(userRef, updateData);

            setSuccess(true);
            setIsEditing(false);
            setIsNewUser(false);

            setTimeout(() => setSuccess(false), 3000);

            // If it was a new user, redirect to dashboard after saving
            if (isNewUser) {
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isNewUser) {
            // New users must complete their profile
            setError('Please complete your profile to continue');
            return;
        }

        // Reset form to original values
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                department: (userProfile as StudentProfile | FacultyProfile).department || '',
                enrollmentNumber: (userProfile as StudentProfile).enrollmentNumber || '',
                year: (userProfile as StudentProfile).year || undefined,
                employeeId: (userProfile as FacultyProfile).employeeId || '',
                githubUsername: (userProfile as StudentProfile).githubUsername || '',
                institutionId: userProfile.institutionId || '',
            });
        }
        setIsEditing(false);
        setError('');
    };

    // Show loading only when auth is loading
    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    // For new users without profile yet, show the form
    const isStudent = userProfile?.role === 'student' || !userProfile;
    const studentProfile = userProfile as StudentProfile | null;
    const facultyProfile = userProfile as FacultyProfile | null;

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isNewUser ? 'Complete Your Profile' : 'My Profile'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isNewUser
                                ? 'Please fill in your details to get started'
                                : 'View and manage your profile information'}
                        </p>
                    </div>
                    {!isNewUser && !isEditing && (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Profile updated successfully!
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Profile Picture & Basic Info */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                {userProfile?.photoURL ? (
                                    <img
                                        src={userProfile.photoURL}
                                        alt={userProfile.displayName}
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                {isEditing ? (
                                    <Input
                                        label="Display Name"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                ) : (
                                    <>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {userProfile?.displayName || 'User'}
                                        </h2>
                                        <p className="text-gray-500 capitalize">{userProfile?.role || 'student'}</p>
                                    </>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-gray-500">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{userProfile?.email || currentUser?.email || ''}</span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Institution & Academic Info */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary-600" />
                            Institution Details
                        </h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isEditing ? (
                                <>
                                    <Input
                                        label="Institution Name"
                                        name="institutionId"
                                        value={formData.institutionId}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Stanford University"
                                        required
                                    />
                                    <Input
                                        label="Department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Computer Science"
                                        required
                                    />
                                    {isStudent ? (
                                        <>
                                            <Input
                                                label="Enrollment Number"
                                                name="enrollmentNumber"
                                                value={formData.enrollmentNumber || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g., 2024CS001"
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year of Study
                                                </label>
                                                <select
                                                    name="year"
                                                    value={formData.year || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                >
                                                    <option value="">Select year</option>
                                                    <option value="1">1st Year</option>
                                                    <option value="2">2nd Year</option>
                                                    <option value="3">3rd Year</option>
                                                    <option value="4">4th Year</option>
                                                    <option value="5">5th Year</option>
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <Input
                                            label="Employee ID"
                                            name="employeeId"
                                            value={formData.employeeId || ''}
                                            onChange={handleInputChange}
                                            placeholder="e.g., FAC2024001"
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500">Institution</p>
                                        <p className="font-medium text-gray-900">
                                            {userProfile?.institutionId || 'Not set'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="font-medium text-gray-900">
                                            {(userProfile as StudentProfile | FacultyProfile)?.department || 'Not set'}
                                        </p>
                                    </div>
                                    {isStudent ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-500">Enrollment Number</p>
                                                <p className="font-medium text-gray-900">
                                                    {studentProfile?.enrollmentNumber || 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Year of Study</p>
                                                <p className="font-medium text-gray-900">
                                                    {studentProfile?.year ? `${studentProfile.year}${getOrdinalSuffix(studentProfile.year)} Year` : 'Not set'}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-gray-500">Employee ID</p>
                                            <p className="font-medium text-gray-900">
                                                {facultyProfile?.employeeId || 'Not set'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* GitHub Integration (Students only) */}
                {isStudent && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Github className="w-5 h-5" />
                                GitHub Integration
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            {isEditing ? (
                                <Input
                                    label="GitHub Username"
                                    name="githubUsername"
                                    value={formData.githubUsername || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., johndoe"
                                />
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">GitHub Username</p>
                                        <p className="font-medium text-gray-900">
                                            {studentProfile?.githubUsername || 'Not connected'}
                                        </p>
                                    </div>
                                    {studentProfile?.githubConnected && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                            <CheckCircle className="w-4 h-4" />
                                            Connected
                                        </span>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary-600" />
                            Account Information
                        </h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Account Type</p>
                                <p className="font-medium text-gray-900 capitalize">{userProfile?.role || 'student'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Member Since</p>
                                <p className="font-medium text-gray-900">
                                    {userProfile?.createdAt
                                        ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                            {isStudent && (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500">Assessments Completed</p>
                                        <p className="font-medium text-gray-900">
                                            {studentProfile?.assessmentHistory?.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Teams Joined</p>
                                        <p className="font-medium text-gray-900">
                                            {studentProfile?.teamAssignments?.length || 0}
                                        </p>
                                    </div>
                                </>
                            )}
                            {userProfile?.role === 'faculty' && (
                                <div>
                                    <p className="text-sm text-gray-500">Courses Managed</p>
                                    <p className="font-medium text-gray-900">
                                        {facultyProfile?.coursesManaged?.length || 0}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex justify-end gap-3">
                        {!isNewUser && (
                            <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isNewUser ? 'Complete Profile' : 'Save Changes'}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
