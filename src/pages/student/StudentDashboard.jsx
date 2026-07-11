import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarCheck, 
  Award, 
  Clock, 
  LogOut, 
  Menu, 
  Bell, 
  GraduationCap,
  Calendar,
  User as UserIcon,
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  Phone,
  HeartPulse,
  Info,
  Users,
  CalendarDays
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts'

const menuItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'grades', icon: BookOpen, label: 'Grades' },
  { id: 'attendance', icon: CalendarCheck, label: 'Attendance' },
  { id: 'activities', icon: Award, label: 'Activities' },
  { id: 'timeline', icon: Clock, label: 'Timeline' },
]

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedExamType, setSelectedExamType] = useState('all')

  useEffect(() => {
    if (profile?.id) fetchAllData()
  }, [profile])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*, classes(name, section)')
        .eq('profile_id', profile.id)
        .single()
      setStudent(studentData)

      if (studentData) {
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*, subjects(name)')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
        setGrades(gradesData || [])

        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentData.id)
          .order('date', { ascending: false })
          .limit(30)
        setAttendance(attendanceData || [])

        const { data: activitiesData } = await supabase
          .from('student_activities')
          .select('*, activities(name, type, date)')
          .eq('student_id', studentData.id)
        setActivities(activitiesData || [])

        const { data: timelineData } = await supabase
          .from('student_timeline')
          .select('*')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
        setTimeline(timelineData || [])
      }

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

  const totalDays = attendance.length
  const presentDays = attendance.filter(a => a.status === 'present').length
  const absentDays = attendance.filter(a => a.status === 'absent').length
  const lateDays = attendance.filter(a => a.status === 'late').length
  const attendancePercent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0
  const totalMarks = grades.reduce((sum, g) => sum + Number(g.marks_obtained), 0)
  const totalPossible = grades.reduce((sum, g) => sum + Number(g.total_marks), 0)
  const overallPercent = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-emerald-400'
    if (grade === 'B+' || grade === 'B') return 'text-blue-400'
    if (grade === 'C') return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGradeBg = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    if (grade === 'B+' || grade === 'B') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    if (grade === 'C') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }

  // Radar chart data
  const radarData = grades.slice(0, 6).map(g => ({
    subject: g.subjects?.name?.slice(0, 8) || 'General',
    score: ((g.marks_obtained / g.total_marks) * 100).toFixed(0),
  }))

  // Pie chart data
  const pieData = [
    { name: 'Present', value: presentDays, color: '#10b981' },
    { name: 'Absent', value: absentDays, color: '#ef4444' },
    { name: 'Late', value: lateDays, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const timelineIcons = {
    'Grade Added': <BookOpen size={20} className="text-white" />,
    'Fee Payment': <CheckCircle2 size={20} className="text-white" />,
    'Activity Participation': <Award size={20} className="text-white" />,
    'Absence Recorded': <CalendarCheck size={20} className="text-white" />,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-t-pink-500 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
        </div>
        <p className="text-white/60 text-sm tracking-wide uppercase font-semibold">Loading Portal</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden font-sans antialiased text-gray-800 relative bg-[#f8fafc]">
      
      {/* Animated Academic Doodle Background */}
      <style>{`
        @keyframes drift {
          0% { background-position: 0px 0px; }
          100% { background-position: 100px 100px; }
        }
        .academic-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236366f1' stroke-width='1.5' stroke-opacity='0.08'%3E%3Cpath d='M10 20 h10 v15 h-10 z m10 0 h10 v15 h-10 z m0 0 v15' /%3E%3Cpath d='M12 23 h6 m-6 4 h6 m4 -4 h6 m-6 4 h6' /%3E%3Cellipse cx='70' cy='30' rx='12' ry='4' transform='rotate(45 70 30)' /%3E%3Cellipse cx='70' cy='30' rx='12' ry='4' transform='rotate(-45 70 30)' /%3E%3Ccircle cx='70' cy='30' r='2' fill='%236366f1' fill-opacity='0.08' /%3E%3Cpath d='M40 70 l15 -7 l15 7 l-15 7 z m0 0 v8 l15 4 l15 -4 v-8 m-5 8 v8' /%3E%3Ccircle cx='20' cy='80' r='1' /%3E%3Ccircle cx='90' cy='80' r='1' /%3E%3C/g%3E%3C/svg%3E");
          animation: drift 20s linear infinite;
          opacity: 0.8;
        }
      `}</style>
      <div className="academic-bg"></div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `} style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>

        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">OMNIA</h1>
              <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="p-6 border-b border-white/5">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 group cursor-pointer">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {profile?.full_name?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#0f172a' }}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <p className="font-semibold text-white text-sm">{profile?.full_name}</p>
            <p className="text-xs text-white/50 mt-0.5 font-normal">{student?.classes?.name} {student?.classes?.section}</p>
            <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              Active
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-4 px-2">Main Menu</p>
          <ul className="space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === item.id
                        ? 'text-white shadow-md'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    style={activeTab === item.id ? {
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 4px 15px rgba(99,102,241,0.2)'
                    } : {}}
                  >
                    <Icon size={18} className={activeTab === item.id ? 'text-white' : 'text-white/50'} />
                    {item.label}
                    {activeTab === item.id && (
                      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={async () => { await signOut(); window.location.href = '/login' }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="font-bold text-gray-800 text-xl">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'grades' && 'Academic Grades'}
                {activeTab === 'attendance' && 'Attendance Record'}
                {activeTab === 'activities' && 'My Activities'}
                {activeTab === 'timeline' && 'Activity Timeline'}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                <Bell size={18} />
              </div>
              {announcements.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-[10px] font-bold">{announcements.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 ml-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {profile?.full_name?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{profile?.full_name}</p>
                <p className="text-[11px] font-medium text-gray-500">Student</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Attendance Rate', value: `${attendancePercent}%`, sub: `${presentDays} days present`, gradient: 'from-emerald-400 to-teal-500', icon: CalendarCheck, glow: 'rgba(16,185,129,0.2)' },
                  { label: 'Overall Grade', value: `${overallPercent}%`, sub: `${grades.length} exams taken`, gradient: 'from-violet-400 to-purple-500', icon: TrendingUp, glow: 'rgba(139,92,246,0.2)' },
                  { label: 'Activities', value: activities.length, sub: 'Participated', gradient: 'from-orange-400 to-pink-500', icon: Award, glow: 'rgba(249,115,22,0.2)' },
                  { label: 'Roll Number', value: `#${student?.roll_number || 'N/A'}`, sub: `${student?.classes?.name} ${student?.classes?.section}`, gradient: 'from-blue-400 to-cyan-500', icon: GraduationCap, glow: 'rgba(59,130,246,0.2)' },
                ].map((stat, i) => (
                  <div key={i} className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-[0.05] rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500`}></div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
                      style={{ boxShadow: `0 4px 15px ${stat.glow}` }}>
                      <stat.icon size={20} className="text-white" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-1.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Radar Chart */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Subject Performance</h3>
                      <p className="text-xs font-medium text-gray-500 mt-1">Skill radar overview</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                      {grades.length} subjects
                    </span>
                  </div>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }} />
                        <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">No grade data yet</div>
                  )}
                </div>

                {/* Donut Chart */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Attendance Breakdown</h3>
                      <p className="text-xs font-medium text-gray-500 mt-1">Last 30 days</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {attendancePercent}% rate
                    </span>
                  </div>
                  {pieData.length > 0 ? (
                    <div className="flex items-center gap-8 h-[260px]">
                      <ResponsiveContainer width="55%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-4 flex-1">
                        {pieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                              <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">No attendance data yet</div>
                  )}
                </div>
              </div>

              {/* Announcements + Personal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg">
                    <span className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Bell size={20} />
                    </span>
                    Announcements
                    {announcements.length > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">{announcements.length} NEW</span>
                    )}
                  </h3>
                  {announcements.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                      <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map(a => (
                        <div key={a.id} className="p-5 rounded-2xl border-l-4 border-violet-400 transition-colors hover:bg-gray-50"
                          style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.03), rgba(139,92,246,0.01))' }}>
                          <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                          <p className="text-gray-600 text-xs mt-2 leading-relaxed font-normal">{a.message}</p>
                          <p className="text-gray-400 text-[10px] font-semibold mt-3 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg">
                    <span className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                      <UserIcon size={20} />
                    </span>
                    Personal Info
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Full Name', value: profile?.full_name },
                      { label: 'Class', value: `${student?.classes?.name} ${student?.classes?.section}` },
                      { label: 'Roll Number', value: student?.roll_number },
                      { label: 'Date of Birth', value: student?.date_of_birth },
                      { label: 'Blood Group', value: student?.blood_group },
                      { label: 'Phone', value: profile?.phone },
                      { label: 'Emergency Contact', value: student?.emergency_contact },
                      { label: 'Emergency Phone', value: student?.emergency_phone }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800">{item.value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRADES */}
          {activeTab === 'grades' && (() => {
            const examTypes = [...new Set(grades.map(g => g.exam_type))]
            const displayedGrades = selectedExamType === 'all' 
              ? grades 
              : grades.filter(g => g.exam_type === selectedExamType)

            return (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Overall Average', value: `${overallPercent}%`, color: 'from-violet-500 to-purple-600', shadow: 'rgba(139,92,246,0.2)' },
                    { label: 'Total Exams', value: grades.length, color: 'from-blue-500 to-cyan-500', shadow: 'rgba(59,130,246,0.2)' },
                    { label: 'Top Grade', value: grades.length > 0 ? grades.reduce((best, g) => (g.marks_obtained / g.total_marks) > (best.marks_obtained / best.total_marks) ? g : best, grades[0])?.grade : 'N/A', color: 'from-emerald-400 to-teal-500', shadow: 'rgba(16,185,129,0.2)' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-gradient-to-br ${s.color} rounded-3xl p-6 text-white shadow-lg hover:-translate-y-1 transition-transform duration-300`}
                      style={{ boxShadow: `0 10px 25px -5px ${s.shadow}` }}>
                      <p className="text-4xl font-bold">{s.value}</p>
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mt-2">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Filter Tabs */}
                {grades.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                      onClick={() => setSelectedExamType('all')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300
                        ${selectedExamType === 'all' ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      All Exams
                    </button>
                    {examTypes.map(type => (
                      <button 
                        key={type}
                        onClick={() => setSelectedExamType(type)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300
                          ${selectedExamType === type ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                      >
                        {type?.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-3">
                      <BookOpen size={20} className="text-violet-500" />
                      Academic Results
                    </h3>
                  </div>
                  {displayedGrades.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50">
                      <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">No grades found for this selection</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {displayedGrades.map((grade, i) => {
                        const pct = ((grade.marks_obtained / grade.total_marks) * 100).toFixed(1)
                        return (
                          <div key={grade.id} className="flex items-center gap-6 px-6 py-5 hover:bg-gray-50 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm group-hover:scale-105 transition-transform">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-base">{grade.subjects?.name || 'General'}</p>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{grade.exam_type?.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right w-32">
                              <p className="font-bold text-gray-800 text-sm">{grade.marks_obtained} <span className="text-gray-400 font-medium">/ {grade.total_marks}</span></p>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${getGradeBg(grade.grade)}`}>
                                {grade.grade}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Days', value: totalDays, color: 'bg-gray-800 text-white', icon: CalendarDays },
                  { label: 'Present', value: presentDays, color: 'bg-emerald-500 text-white', icon: CheckCircle2 },
                  { label: 'Absent', value: absentDays, color: 'bg-rose-500 text-white', icon: XCircle },
                  { label: 'Attendance Rate', value: `${attendancePercent}%`, color: 'bg-gradient-to-br from-violet-500 to-purple-500 text-white', icon: TrendingUp },
                ].map((s, i) => (
                  <div key={i} className={`${s.color} rounded-3xl p-6 shadow-md hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <s.icon size={48} />
                    </div>
                    <p className="text-4xl font-bold relative z-10">{s.value}</p>
                    <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wider mt-2 relative z-10">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-3">
                    <CalendarCheck size={20} className="text-blue-500" />
                    Attendance History
                  </h3>
                </div>
                {attendance.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50">
                    <CalendarCheck size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">No records yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {attendance.map(record => (
                      <div key={record.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${record.status === 'present' ? 'bg-emerald-400 shadow-emerald-100' :
                              record.status === 'absent' ? 'bg-rose-400 shadow-rose-100' :
                                record.status === 'late' ? 'bg-yellow-400 shadow-yellow-100' : 'bg-blue-400 shadow-blue-100'
                            }`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            record.status === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              record.status === 'late' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>{record.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">My Activities</h2>
                  <p className="text-gray-500 text-sm mt-1 font-medium">{activities.length} total participations</p>
                </div>
              </div>
              {activities.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <Award size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">No activities yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((sa, i) => {
                    const colors = ['from-violet-500 to-purple-500', 'from-blue-500 to-cyan-500', 'from-emerald-400 to-teal-500', 'from-orange-400 to-pink-500']
                    return (
                      <div key={sa.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[i % colors.length]} opacity-[0.03] rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500`}></div>
                        <div className={`w-12 h-12 bg-gradient-to-br ${colors[i % colors.length]} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                          <Award size={22} className="text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg relative z-10">{sa.activities?.name}</h3>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1 mb-4 relative z-10">{sa.activities?.type}</p>
                        
                        <div className="space-y-3 pt-4 border-t border-gray-50 relative z-10">
                          {sa.role && (
                            <div className="flex items-center gap-3">
                              <UserIcon size={14} className="text-gray-400" />
                              <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">{sa.role}</span>
                            </div>
                          )}
                          {sa.achievement && (
                            <div className="flex items-start gap-3 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                              <Award size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                              <span className="text-xs font-bold text-yellow-700 leading-snug">{sa.achievement}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-gray-500">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-xs font-medium">{sa.activities?.date ? new Date(sa.activities.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Activity Timeline</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">Your complete school journey</p>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-3xl">
                {timeline.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl">
                    <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-11 top-4 bottom-4 w-0.5 bg-gradient-to-b from-violet-400 to-purple-500 opacity-20"></div>
                    <div className="space-y-8">
                      {timeline.map((event, i) => (
                        <div key={event.id} className="flex gap-6 relative group">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm group-hover:scale-105 transition-transform duration-300"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {timelineIcons[event.event_type] || <Info size={20} className="text-white" />}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100 group-hover:bg-white group-hover:shadow-sm group-hover:border-violet-100 transition-all duration-300">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">{event.event_type}</p>
                              <p className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-50">
                                <Clock size={12} />
                                {new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 font-medium leading-relaxed">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}