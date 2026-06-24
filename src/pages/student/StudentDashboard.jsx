import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
    const { profile, signOut } = useAuth()
    const [student, setStudent] = useState(null)
    const [grades, setGrades] = useState([])
    const [attendance, setAttendance] = useState([])
    const [activities, setActivities] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [timeline, setTimeline] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (profile?.id) fetchAllData()
    }, [profile])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            // Fetch student details
            const { data: studentData } = await supabase
                .from('students')
                .select('*, classes(name, section)')
                .eq('profile_id', profile.id)
                .single()
            setStudent(studentData)

            if (studentData) {
                // Fetch grades
                const { data: gradesData } = await supabase
                    .from('grades')
                    .select('*, subjects(name)')
                    .eq('student_id', studentData.id)
                    .order('created_at', { ascending: false })
                setGrades(gradesData || [])

                // Fetch attendance
                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('date', { ascending: false })
                    .limit(30)
                setAttendance(attendanceData || [])

                // Fetch activities
                const { data: activitiesData } = await supabase
                    .from('student_activities')
                    .select('*, activities(name, type, date)')
                    .eq('student_id', studentData.id)
                setActivities(activitiesData || [])

                // Fetch timeline
                const { data: timelineData } = await supabase
                    .from('student_timeline')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('created_at', { ascending: false })
                setTimeline(timelineData || [])
            }

            // Fetch announcements
            const { data: announcementsData } = await supabase
                .from('announcements')
                .select('*')
                .in('target_role', ['all', 'student'])
                .order('created_at', { ascending: false })
                .limit(5)
            setAnnouncements(announcementsData || [])

        } catch (err) {
            toast.error('Failed to load data')
        }
        setLoading(false)
    }

    const handleSignOut = async () => {
        await signOut()
    }

    // Attendance stats
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'present').length
    const absentDays = attendance.filter(a => a.status === 'absent').length
    const attendancePercent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0

    // Grade stats
    const totalMarks = grades.reduce((sum, g) => sum + Number(g.marks_obtained), 0)
    const totalPossible = grades.reduce((sum, g) => sum + Number(g.total_marks), 0)
    const overallPercent = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0

    const getGradeColor = (grade) => {
        if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-700'
        if (grade === 'B+' || grade === 'B') return 'bg-blue-100 text-blue-700'
        if (grade === 'C') return 'bg-yellow-100 text-yellow-700'
        if (grade === 'D') return 'bg-orange-100 text-orange-700'
        return 'bg-red-100 text-red-700'
    }

    const tabs = ['overview', 'grades', 'attendance', 'activities', 'timeline']

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your dashboard...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">🏫</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">Student Portal</h1>
                        <p className="text-xs text-gray-400">Omnia School Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-800">{profile?.full_name}</p>
                        <p className="text-xs text-gray-400">Student</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                            {profile?.full_name?.charAt(0)}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-sm text-red-500 hover:text-red-700 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-6">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-blue-600">
                            {profile?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800">{profile?.full_name}</h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                <span>🏫 {student?.classes?.name} {student?.classes?.section}</span>
                                <span>📋 Roll: {student?.roll_number || 'N/A'}</span>
                                <span>📞 {profile?.phone || 'N/A'}</span>
                                <span>🩸 {student?.blood_group || 'N/A'}</span>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                            {student?.status || 'active'}
                        </span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-blue-600">{attendancePercent}%</p>
                        <p className="text-xs text-gray-400 mt-1">Attendance</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                        <p className="text-xs text-gray-400 mt-1">Days Present</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-purple-600">{overallPercent}%</p>
                        <p className="text-xs text-gray-400 mt-1">Overall Grade</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-orange-600">{activities.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Activities</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition ${activeTab === tab
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">

                        {/* Announcements */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4">📢 Latest Announcements</h3>
                            {announcements.length === 0 ? (
                                <p className="text-gray-400 text-sm">No announcements yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {announcements.map(a => (
                                        <div key={a.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                                            <p className="text-gray-500 text-sm mt-1">{a.message}</p>
                                            <p className="text-gray-400 text-xs mt-2">
                                                {new Date(a.created_at).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Personal Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="font-semibold text-gray-700 mb-4">Personal Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Date of Birth</span>
                                        <span className="text-gray-700">{student?.date_of_birth || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Gender</span>
                                        <span className="text-gray-700 capitalize">{student?.gender || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Blood Group</span>
                                        <span className="text-gray-700">{student?.blood_group || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Admission Date</span>
                                        <span className="text-gray-700">{student?.admission_date || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="font-semibold text-gray-700 mb-4">Emergency Contact</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Contact Person</span>
                                        <span className="text-gray-700">{student?.emergency_contact || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Phone</span>
                                        <span className="text-gray-700">{student?.emergency_phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Medical Notes</span>
                                        <span className="text-gray-700">{student?.medical_notes || 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grades Tab */}
                {activeTab === 'grades' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">My Grades</h3>
                            <span className="text-sm text-gray-400">Overall: {overallPercent}%</span>
                        </div>
                        {grades.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">📝</p>
                                <p className="text-gray-400">No grades recorded yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Exam</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Marks</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">%</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map((grade, i) => (
                                            <tr key={grade.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-5 py-3 font-medium text-gray-800">{grade.subjects?.name || 'General'}</td>
                                                <td className="px-5 py-3 text-gray-500 capitalize">{grade.exam_type?.replace('_', ' ')}</td>
                                                <td className="px-5 py-3 text-gray-800">{grade.marks_obtained}/{grade.total_marks}</td>
                                                <td className="px-5 py-3 text-gray-600">{((grade.marks_obtained / grade.total_marks) * 100).toFixed(1)}%</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.grade)}`}>
                                                        {grade.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            <h3 className="font-semibold text-gray-800">My Attendance</h3>
                            <div className="flex gap-3 text-sm">
                                <span className="text-green-600 font-medium">✅ Present: {presentDays}</span>
                                <span className="text-red-500 font-medium">❌ Absent: {absentDays}</span>
                                <span className="text-blue-600 font-medium">📊 {attendancePercent}%</span>
                            </div>
                        </div>
                        {attendance.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">✅</p>
                                <p className="text-gray-400">No attendance records yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map((record, i) => (
                                            <tr key={record.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-5 py-3 text-gray-800">{record.date}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                        record.status === 'absent' ? 'bg-red-100 text-red-700' :
                                                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">My Activities</h3>
                        </div>
                        {activities.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">🏆</p>
                                <p className="text-gray-400">No activities yet</p>
                            </div>
                        ) : (
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activities.map(sa => (
                                    <div key={sa.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="font-semibold text-gray-800">{sa.activities?.name}</p>
                                        <p className="text-sm text-gray-500 capitalize mt-1">{sa.activities?.type}</p>
                                        {sa.role && <p className="text-sm text-blue-600 mt-1">Role: {sa.role}</p>}
                                        {sa.achievement && (
                                            <p className="text-sm text-yellow-600 font-medium mt-1">🏅 {sa.achievement}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">📅 {sa.activities?.date || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4">My Timeline</h3>
                        {timeline.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No activity recorded yet</p>
                        ) : (
                            <div className="space-y-4">
                                {timeline.map(event => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{event.event_type}</p>
                                            <p className="text-sm text-gray-500">{event.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(event.created_at).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}