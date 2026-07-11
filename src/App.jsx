import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/students/Students'
import StudentProfile from './pages/students/StudentProfile'
import Attendance from './pages/attendance/Attendance'
import Grades from './pages/grades/Grades'
import Fees from './pages/fees/Fees'
import Activities from './pages/activities/Activities'
import Timetable from './pages/timetable/Timetable'
import Communication from './pages/communication/Communication'
import Classes from './pages/classes/Classes'
import Teachers from './pages/teachers/Teachers'
import StudentDashboard from './pages/student/StudentDashboard'

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!user) return <Navigate to="/login" />
  if (profile?.role === 'student') return <Navigate to="/student-dashboard" />
  if (profile?.role === 'teacher') return <Navigate to="/teacher-dashboard" />

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
          <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}