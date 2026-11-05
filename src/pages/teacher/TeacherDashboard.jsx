import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
    Users, CalendarCheck, ClipboardSignature, BellRing,
    GraduationCap, Phone, CalendarDays, LogOut,
    CheckCircle2, XCircle, Clock, BookOpen,
    ChevronDown, ChevronUp, Award, Building2
} from 'lucide-react'

const TABS = ['overview', 'attendance', 'grades', 'announcements']

const avatarColors = [
    'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500',
    'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
    'bg-indigo-500', 'bg-pink-500'
]

export default function TeacherDashboard() {
    const { profile, signOut } = useAuth()

    // Teacher record
    const [teacher, setTeacher] = useState(null)

    // Assigned classes & students
    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])

    // Attendance
    const [attendanceDate, setAttendanceDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [attendanceMap, setAttendanceMap] = useState({})   // { student_id: status }
    const [savingAttendance, setSavingAttendance] = useState(false)
    const [existingAttendance, setExistingAttendance] = useState([])

    // Grades
    const [recentGrades, setRecentGrades] = useState([])

    // Announcements
    const [announcements, setAnnouncements] = useState([])
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' })
    const [postingAnnouncement, setPostingAnnouncement] = useState(false)

    // UI
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedClass, setSelectedClass] = useState(null)
    const [expandedClass, setExpandedClass] = useState(null)

    /* ─── Boot ─────────────────────────────────────────── */
    useEffect(() => {
        if (profile?.id) fetchAll()
    }, [profile])

    useEffect(() => {
        if (selectedClass && students.length > 0) fetchAttendanceForDate()
    }, [attendanceDate, selectedClass, students])

    /* ─── Data fetching ────────────────────────────────── */
    const fetchAll = async () => {
        setLoading(true)
        try {
            // 1. Teacher record
            const { data: teacherData } = await supabase
                .from('teachers')
                .select('*')
                .eq('profile_id', profile.id)
                .single()
            setTeacher(teacherData)

            // 2. All classes (teacher → class via class_teachers join OR all classes if no join table)
            //    We fetch all classes and students for now; adapt if you have a class_teachers table
            const { data: classesData } = await supabase
                .from('classes')
                .select('id, name, section')
                .order('name')
            setClasses(classesData || [])
            if (classesData?.length > 0) setSelectedClass(classesData[0].id)

            // 3. All students (linked to classes)
            const { data: studentsData } = await supabase
                .from('students')
                .select('id, roll_number, class_id, profile_id, profiles(full_name)')
                .eq('status', 'active')
                .order('roll_number')
            setStudents(studentsData || [])

            // 4. Recent grades
            const { data: gradesData } = await supabase
                .from('grades')
                .select('*, students(id, profiles(full_name)), subjects(name)')
                .order('created_at', { ascending: false })
                .limit(20)
            setRecentGrades(gradesData || [])

            // 5. Announcements
            const { data: announcementsData } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)
            setAnnouncements(announcementsData || [])

        } catch (err) {
            toast.error('Failed to load dashboard')
        }
        setLoading(false)
    }

    const fetchAttendanceForDate = async () => {
        if (!selectedClass) return
        const classStudentIds = students
            .filter(s => s.class_id === selectedClass)
            .map(s => s.id)
        if (classStudentIds.length === 0) return

        const { data } = await supabase
            .from('attendance')
            .select('*')
            .in('student_id', classStudentIds)
            .eq('date', attendanceDate)

        const map = {}
        ;(data || []).forEach(r => { map[r.student_id] = r.status })
        setAttendanceMap(map)
        setExistingAttendance(data || [])
    }

    /* ─── Attendance save ──────────────────────────────── */
    const handleAttendanceChange = (studentId, status) => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }))
    }

    const saveAttendance = async () => {
        const classStudents = students.filter(s => s.class_id === selectedClass)
        if (classStudents.length === 0) {
            toast.error('No students in this class')
            return
        }
        setSavingAttendance(true)
        try {
            const upsertRows = classStudents.map(s => ({
                student_id: s.id,
                date: attendanceDate,
                status: attendanceMap[s.id] || 'present',
            }))

            const { error } = await supabase
                .from('attendance')
                .upsert(upsertRows, { onConflict: 'student_id,date' })

            if (error) throw error
            toast.success('Attendance saved!')
            fetchAttendanceForDate()
        } catch (err) {
            toast.error(err.message)
        }
        setSavingAttendance(false)
    }

    /* ─── Announcement post ────────────────────────────── */
    const postAnnouncement = async () => {
        if (!newAnnouncement.title.trim()) {
            toast.error('Title is required')
            return
        }
        setPostingAnnouncement(true)
        try {
            const { error } = await supabase.from('announcements').insert({
                title: newAnnouncement.title,
                message: newAnnouncement.message,
                target_role: 'all',
            })
            if (error) throw error
            toast.success('Announcement posted!')
            setNewAnnouncement({ title: '', message: '' })
            const { data } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)
            setAnnouncements(data || [])
        } catch (err) {
            toast.error(err.message)
        }
        setPostingAnnouncement(false)
    }

    /* ─── Computed ─────────────────────────────────────── */
    const classStudents = students.filter(s => s.class_id === selectedClass)
    const totalStudents = students.length
    const totalClasses = classes.length
    const presentToday = existingAttendance.filter(a => a.status === 'present').length
    const absentToday = existingAttendance.filter(a => a.status === 'absent').length

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId)
        return cls ? `${cls.name} ${cls.section || ''}`.trim() : '—'
    }

    const getAttendanceIcon = (status) => {
        if (status === 'present') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        if (status === 'absent') return <XCircle className="w-4 h-4 text-rose-500" />
        if (status === 'late') return <Clock className="w-4 h-4 text-amber-500" />
        return <Clock className="w-4 h-4 text-sky-500" />
    }

    /* ─── Loading ──────────────────────────────────────── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">Loading your workspace...</p>
            </div>
        </div>
    )

    /* ─── Render ───────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-zinc-50 relative overflow-x-hidden">

            {/* Ambient blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 blur-[120px] pointer-events-none" />

            {/* ── Header ── */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white shadow-sm shadow-violet-900/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Omnia" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                    <div>
                        <h1 className="font-bold text-zinc-800 text-sm tracking-tight">Omnia</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Teacher Portal</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-zinc-800">{profile?.full_name}</p>
                        <p className="text-xs text-zinc-400">{teacher?.subject || 'Teacher'}</p>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-md shadow-violet-600/20 border border-white">
                        <span className="text-white text-sm font-bold">
                            {profile?.full_name?.charAt(0)}
                        </span>
                    </div>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 relative z-10">

                {/* ── Profile Card ── */}
                <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-violet-500/30">
                        {profile?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">{profile?.full_name}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                            {teacher?.subject && (
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-violet-400" />
                                    {teacher.subject}
                                </span>
                            )}
                            {profile?.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-4 h-4 text-zinc-400" />
                                    {profile.phone}
                                </span>
                            )}
                            {teacher?.qualification && (
                                <span className="flex items-center gap-1.5">
                                    <GraduationCap className="w-4 h-4 text-zinc-400" />
                                    {teacher.qualification}
                                </span>
                            )}
                            {teacher?.joining_date && (
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-zinc-400" />
                                    Joined {teacher.joining_date}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="badge-glass-violet">Teacher</span>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Classes', value: totalClasses, icon: Building2, color: 'text-sky-600', bg: 'bg-sky-500/10 border-sky-500/20' },
                        { label: 'Students', value: totalStudents, icon: Users, color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/20' },
                        { label: 'Present Today', value: presentToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Absent Today', value: absentToday, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/20' },
                    ].map(stat => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label} className="glass-panel p-5 flex flex-col gap-3">
                                <div className={`w-10 h-10 ${stat.bg} border rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-zinc-800 tracking-tight">{stat.value}</p>
                                    <p className="text-zinc-400 text-xs font-medium mt-0.5">{stat.label}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all
                                ${activeTab === tab
                                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-white/70 text-zinc-500 hover:bg-white border border-white hover:text-zinc-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">

                        {/* Classes accordion */}
                        <div className="glass-panel overflow-hidden">
                            <div className="p-5 border-b border-white/60 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-violet-500" />
                                <h3 className="font-bold text-zinc-800 tracking-tight">My Classes</h3>
                            </div>
                            {classes.length === 0 ? (
                                <div className="p-10 text-center text-zinc-400">
                                    <Building2 className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                                    <p>No classes found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/60">
                                    {classes.map(cls => {
                                        const cls_students = students.filter(s => s.class_id === cls.id)
                                        const isExpanded = expandedClass === cls.id
                                        return (
                                            <div key={cls.id}>
                                                <button
                                                    onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                                                    className="w-full flex items-center justify-between p-5 hover:bg-white/40 transition text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-violet-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-zinc-800">{cls.name} {cls.section}</p>
                                                            <p className="text-xs text-zinc-400 mt-0.5">{cls_students.length} students</p>
                                                        </div>
                                                    </div>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                                                        : <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                    }
                                                </button>

                                                {isExpanded && (
                                                    <div className="bg-zinc-50/50 px-5 pb-4">
                                                        {cls_students.length === 0 ? (
                                                            <p className="text-zinc-400 text-sm py-4 text-center">No students enrolled</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                                                {cls_students.map((s, i) => (
                                                                    <div key={s.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-white shadow-sm">
                                                                        <div className={`w-8 h-8 ${avatarColors[i % avatarColors.length]} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                                                                            {s.profiles?.full_name?.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-zinc-800">{s.profiles?.full_name}</p>
                                                                            <p className="text-xs text-zinc-400">Roll: {s.roll_number || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Grades snippet */}
                        <div className="glass-panel overflow-hidden">
                            <div className="p-5 border-b border-white/60 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ClipboardSignature className="w-5 h-5 text-sky-500" />
                                    <h3 className="font-bold text-zinc-800 tracking-tight">Recent Grades</h3>
                                </div>
                                <button onClick={() => setActiveTab('grades')} className="text-xs text-violet-600 hover:underline font-medium">View all</button>
                            </div>
                            {recentGrades.length === 0 ? (
                                <div className="p-10 text-center text-zinc-400">
                                    <ClipboardSignature className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                                    <p>No grades recorded yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50/80">
                                            <tr>
                                                <th className="text-left px-5 py-3 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Student</th>
                                                <th className="text-left px-5 py-3 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Subject</th>
                                                <th className="text-left px-5 py-3 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Exam</th>
                                                <th className="text-left px-5 py-3 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Marks</th>
                                                <th className="text-left px-5 py-3 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100/60">
                                            {recentGrades.slice(0, 8).map(g => (
                                                <tr key={g.id} className="hover:bg-white/60 transition">
                                                    <td className="px-5 py-3 font-medium text-zinc-800">{g.students?.profiles?.full_name || '—'}</td>
                                                    <td className="px-5 py-3 text-zinc-500">{g.subjects?.name || 'General'}</td>
                                                    <td className="px-5 py-3 text-zinc-500 capitalize">{g.exam_type?.replace('_', ' ')}</td>
                                                    <td className="px-5 py-3 text-zinc-700">{g.marks_obtained}/{g.total_marks}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                            ${g.grade === 'A+' || g.grade === 'A' ? 'bg-emerald-100 text-emerald-700'
                                                            : g.grade === 'B+' || g.grade === 'B' ? 'bg-sky-100 text-sky-700'
                                                            : g.grade === 'C' ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-rose-100 text-rose-700'}`}>
                                                            {g.grade || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: ATTENDANCE
                ══════════════════════════════════════════════ */}
                {activeTab === 'attendance' && (
                    <div className="glass-panel overflow-hidden">
                        {/* Controls */}
                        <div className="p-5 border-b border-white/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarCheck className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-bold text-zinc-800 tracking-tight">Mark Attendance</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {/* Class selector */}
                                <select
                                    value={selectedClass || ''}
                                    onChange={e => setSelectedClass(e.target.value)}
                                    className="input-glass py-2 pr-8 w-auto"
                                >
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} {cls.section}
                                        </option>
                                    ))}
                                </select>
                                {/* Date picker */}
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                    className="input-glass py-2 w-auto"
                                />
                            </div>
                        </div>

                        {/* Quick-mark all buttons */}
                        <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2 border-b border-white/40">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider self-center mr-1">Mark all:</span>
                            {['present', 'absent', 'late', 'leave'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        const map = {}
                                        classStudents.forEach(st => { map[st.id] = s })
                                        setAttendanceMap(map)
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition
                                        ${s === 'present' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        : s === 'absent' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                        : s === 'late' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                        : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Student list */}
                        {classStudents.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400">
                                <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                <p>No students in this class</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-zinc-100/60">
                                    {classStudents.map((student, i) => {
                                        const status = attendanceMap[student.id] || 'present'
                                        return (
                                            <div key={student.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/40 transition">
                                                <div className={`w-9 h-9 ${avatarColors[i % avatarColors.length]} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                                    {student.profiles?.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-zinc-800 text-sm truncate">{student.profiles?.full_name}</p>
                                                    <p className="text-xs text-zinc-400">Roll: {student.roll_number || 'N/A'}</p>
                                                </div>
                                                {/* Status buttons */}
                                                <div className="flex gap-1.5 shrink-0">
                                                    {[
                                                        { key: 'present', label: '✓', activeClass: 'bg-emerald-500 text-white border-emerald-500', inactiveClass: 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
                                                        { key: 'absent', label: '✗', activeClass: 'bg-rose-500 text-white border-rose-500', inactiveClass: 'bg-white text-rose-500 border-rose-200 hover:bg-rose-50' },
                                                        { key: 'late', label: '⏱', activeClass: 'bg-amber-400 text-white border-amber-400', inactiveClass: 'bg-white text-amber-500 border-amber-200 hover:bg-amber-50' },
                                                        { key: 'leave', label: '🏠', activeClass: 'bg-sky-400 text-white border-sky-400', inactiveClass: 'bg-white text-sky-500 border-sky-200 hover:bg-sky-50' },
                                                    ].map(btn => (
                                                        <button
                                                            key={btn.key}
                                                            onClick={() => handleAttendanceChange(student.id, btn.key)}
                                                            title={btn.key}
                                                            className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all
                                                                ${status === btn.key ? btn.activeClass : btn.inactiveClass}`}
                                                        >
                                                            {btn.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Save button */}
                                <div className="p-5 border-t border-white/60 flex items-center justify-between flex-wrap gap-3">
                                    <div className="text-sm text-zinc-500">
                                        <span className="text-emerald-600 font-semibold">
                                            {Object.values(attendanceMap).filter(v => v === 'present').length}
                                        </span> present &nbsp;·&nbsp;
                                        <span className="text-rose-500 font-semibold">
                                            {Object.values(attendanceMap).filter(v => v === 'absent').length}
                                        </span> absent &nbsp;·&nbsp;
                                        <span className="text-amber-500 font-semibold">
                                            {Object.values(attendanceMap).filter(v => v === 'late').length}
                                        </span> late
                                    </div>
                                    <button
                                        onClick={saveAttendance}
                                        disabled={savingAttendance}
                                        className="btn-primary"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                        {savingAttendance ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: GRADES
                ══════════════════════════════════════════════ */}
                {activeTab === 'grades' && (
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-white/60 flex items-center gap-2">
                            <ClipboardSignature className="w-5 h-5 text-sky-500" />
                            <h3 className="font-bold text-zinc-800 tracking-tight">All Grades</h3>
                            <span className="ml-auto text-xs text-zinc-400">{recentGrades.length} records</span>
                        </div>
                        {recentGrades.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400">
                                <Award className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                <p>No grades recorded yet</p>
                                <p className="text-sm mt-1">Grades entered by admin will appear here</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50/80 sticky top-0">
                                        <tr>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Student</th>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Subject</th>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Exam Type</th>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Marks</th>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">%</th>
                                            <th className="text-left px-5 py-3.5 text-zinc-500 font-semibold text-xs uppercase tracking-wider">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100/60">
                                        {recentGrades.map(g => {
                                            const pct = g.total_marks > 0
                                                ? ((g.marks_obtained / g.total_marks) * 100).toFixed(1)
                                                : '—'
                                            return (
                                                <tr key={g.id} className="hover:bg-white/60 transition">
                                                    <td className="px-5 py-3.5 font-medium text-zinc-800">{g.students?.profiles?.full_name || '—'}</td>
                                                    <td className="px-5 py-3.5 text-zinc-500">{g.subjects?.name || 'General'}</td>
                                                    <td className="px-5 py-3.5 text-zinc-500 capitalize">{g.exam_type?.replace('_', ' ') || '—'}</td>
                                                    <td className="px-5 py-3.5 text-zinc-700 font-medium">{g.marks_obtained}/{g.total_marks}</td>
                                                    <td className="px-5 py-3.5 text-zinc-600">{pct}%</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                            ${g.grade === 'A+' || g.grade === 'A' ? 'bg-emerald-100 text-emerald-700'
                                                            : g.grade === 'B+' || g.grade === 'B' ? 'bg-sky-100 text-sky-700'
                                                            : g.grade === 'C' ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-rose-100 text-rose-700'}`}>
                                                            {g.grade || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: ANNOUNCEMENTS
                ══════════════════════════════════════════════ */}
                {activeTab === 'announcements' && (
                    <div className="space-y-5">

                        {/* Post new announcement */}
                        <div className="glass-panel p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <BellRing className="w-5 h-5 text-fuchsia-500" />
                                <h3 className="font-bold text-zinc-800 tracking-tight">Post Announcement</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Parent-Teacher Meeting on Friday"
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Message</label>
                                <textarea
                                    value={newAnnouncement.message}
                                    onChange={e => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Write your announcement here..."
                                    rows={3}
                                    className="input-glass resize-none"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={postAnnouncement}
                                    disabled={postingAnnouncement}
                                    className="btn-primary"
                                >
                                    <BellRing className="w-4 h-4" />
                                    {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
                                </button>
                            </div>
                        </div>

                        {/* Existing announcements */}
                        <div className="glass-panel overflow-hidden">
                            <div className="p-5 border-b border-white/60 flex items-center gap-2">
                                <BellRing className="w-5 h-5 text-fuchsia-500" />
                                <h3 className="font-bold text-zinc-800 tracking-tight">Recent Announcements</h3>
                            </div>
                            {announcements.length === 0 ? (
                                <div className="p-16 text-center text-zinc-400">
                                    <BellRing className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                    <p>No announcements yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100/60">
                                    {announcements.map(a => (
                                        <div key={a.id} className="p-5 hover:bg-white/40 transition">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-zinc-800">{a.title}</p>
                                                    {a.message && (
                                                        <p className="text-sm text-zinc-500 mt-1">{a.message}</p>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 mt-0.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${a.target_role === 'all' ? 'bg-violet-100 text-violet-700'
                                                    : a.target_role === 'student' ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-amber-100 text-amber-700'}`}>
                                                    {a.target_role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-2">
                                                {new Date(a.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

