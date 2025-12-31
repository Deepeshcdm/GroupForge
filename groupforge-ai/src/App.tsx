import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AssessmentProvider } from './contexts';
import {
    LandingPage,
    LoginPage,
    SignupPage,
    DashboardPage,
    AssessmentPage,
    ProfilePage
} from './pages';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AssessmentProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />

                        {/* Protected routes */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/assessment" element={<AssessmentPage />} />
                        <Route path="/my-teams" element={<DashboardPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/courses" element={<DashboardPage />} />
                        <Route path="/teams" element={<DashboardPage />} />
                        <Route path="/analytics" element={<DashboardPage />} />
                        <Route path="/settings" element={<DashboardPage />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AssessmentProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
