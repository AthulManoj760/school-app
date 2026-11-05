import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    Users, UserCircle, Building2, Award, UserPlus,
    CalendarCheck, ClipboardSignature, Wallet, BellRing, ArrowRight,
    Sparkles, PlusCircle
} from 'lucide-react'

const stats = [
    { label: 'Total Students', icon: Users, color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/20', key: 'students', path: '/students' },
    { label: 'Total Teachers', icon: UserCircle, color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20', key: 'teachers', path: '/teachers' },
    { label: 'Total Classes', icon: Building2, color: 'text-sky-600', bg: 'bg-sky-500/10 border-sky-500/20', key: 'classes', path: '/classes' },
    { label: 'Activities', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', key: 'activities', path: '/activities' },
]

const COLORS = ['#8b5cf6', '#d946ef', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316'];

export default function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [counts, setCounts] = useState({
        students: 0,
        teachers: 0,
        classes: 0,
        activities: 0,
    })
    const [classData, setClassData] = useState([])
    const [attendanceData, setAttendanceData] = useState([])

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            // Fetch everything in parallel in a single roundtrip batch
            const results = await Promise.allSettled([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('classes').select('id, name, section'),
                supabase.from('activities').select('*', { count: 'exact', head: true }),
                supabase.from('students').select('class_id, status').eq('status', 'active'),
                supabase.from('attendance').select('status, date').order('date', { ascending: false }).limit(50),
            ])

            const [studentsRes, teachersRes, classesRes, activitiesRes, allStudentsRes, attendanceRes] = results

            const studentsCount = studentsRes.status === 'fulfilled' ? studentsRes.value.count || 0 : 0
            const teachersCount = teachersRes.status === 'fulfilled' ? teachersRes.value.count || 0 : 0
            const classesList = classesRes.status === 'fulfilled' ? classesRes.value.data || [] : []
            const activitiesCount = activitiesRes.status === 'fulfilled' ? activitiesRes.value.count || 0 : 0
            const allStudents = allStudentsRes.status === 'fulfilled' ? allStudentsRes.value.data || [] : []
            const attendanceRows = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data || [] : []

            setCounts({
                students: studentsCount,
                teachers: teachersCount,
                classes: classesList.length,
                activities: activitiesCount,
            })

            // Student class distribution
            if (classesList.length > 0 && allStudents.length > 0) {
                const classCounts = classesList.map(c => {
                    const count = allStudents.filter(s => s.class_id === c.id).length
                    return {
                        name: `${c.name} ${c.section || ''}`.trim(),
                        students: count
                    }
                }).filter(c => c.students > 0)
                  .sort((a, b) => b.students - a.students)

                setClassData(classCounts)
            } else {
                setClassData([])
            }

            // Attendance overview
            if (attendanceRows.length > 0) {
                const latestDate = attendanceRows.find(a => a.date === today)?.date || attendanceRows[0]?.date
                const latestAttendance = attendanceRows.filter(a => a.date === latestDate)

                const statusCounts = latestAttendance.reduce((acc, curr) => {
                    acc[curr.status] = (acc[curr.status] || 0) + 1
                    return acc
                }, {})

                setAttendanceData([
                    { name: 'Present', value: statusCounts['present'] || 0, color: '#10b981' },
                    { name: 'Absent', value: statusCounts['absent'] || 0, color: '#f43f5e' },
                    { name: 'Late', value: statusCounts['late'] || 0, color: '#f59e0b' },
                    { name: 'Leave', value: statusCounts['leave'] || 0, color: '#8b5cf6' },
                ].filter(item => item.value > 0))
            } else {
                setAttendanceData([])
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const seedDemoData = async () => {
        setSeeding(true)
        const toastId = toast.loading('Populating demo data...')
        try {
            // 1. Create Classes
            const { data: createdClasses, error: classErr } = await supabase.from('classes').insert([
                { name: 'Class 10', section: 'A', academic_year: '2025-2026' },
                { name: 'Class 10', section: 'B', academic_year: '2025-2026' },
                { name: 'Class 9', section: 'A', academic_year: '2025-2026' },
                { name: 'Class 8', section: 'A', academic_year: '2025-2026' },
            ]).select()

            if (classErr) throw classErr

            const classA = createdClasses?.[0]?.id
            const classB = createdClasses?.[1]?.id
            const classC = createdClasses?.[2]?.id

            // 2. Create Teachers
            const sampleTeachers = [
                { name: 'Dr. Ramesh Kumar', subject: 'Mathematics', qual: 'Ph.D, M.Sc', phone: '+91 9811122233' },
                { name: 'Sarah Jenkins', subject: 'English', qual: 'M.A. Literature', phone: '+91 9822233344' },
                { name: 'Vikram Mehta', subject: 'Science', qual: 'M.Sc Physics', phone: '+91 9833344455' },
                { name: 'Ananya Roy', subject: 'Computer Science', qual: 'B.Tech CSE', phone: '+91 9844455566' },
            ]

            for (const t of sampleTeachers) {
                const profileId = crypto.randomUUID()
                await supabase.from('profiles').insert({
                    id: profileId,
                    full_name: t.name,
                    phone: t.phone,
                    role: 'teacher'
                })
                await supabase.from('teachers').insert({
                    profile_id: profileId,
                    subject: t.subject,
                    qualification: t.qual,
                    joining_date: '2024-06-01'
                })
            }

            // 3. Create Students
            const sampleStudents = [
                { name: 'Aarav Sharma', roll: '101', classId: classA, gender: 'male', blood: 'O+' },
                { name: 'Diya Patel', roll: '102', classId: classA, gender: 'female', blood: 'A+' },
                { name: 'Ishaan Verma', roll: '103', classId: classA, gender: 'male', blood: 'B+' },
                { name: 'Ananya Nair', roll: '104', classId: classA, gender: 'female', blood: 'AB+' },
                { name: 'Kabir Singh', roll: '105', classId: classB, gender: 'male', blood: 'O-' },
                { name: 'Riya Gupta', roll: '106', classId: classB, gender: 'female', blood: 'A-' },
                { name: 'Arjun Das', roll: '107', classId: classC, gender: 'male', blood: 'B-' },
                { name: 'Meera Iyer', roll: '108', classId: classC, gender: 'female', blood: 'O+' },
            ]

            const createdStudentIds = []
            for (const s of sampleStudents) {
                const profileId = crypto.randomUUID()
                await supabase.from('profiles').insert({
                    id: profileId,
                    full_name: s.name,
                    role: 'student'
                })
                const { data: stRow } = await supabase.from('students').insert({
                    profile_id: profileId,
                    class_id: s.classId,
                    roll_number: s.roll,
                    gender: s.gender,
                    blood_group: s.blood,
                    status: 'active'
                }).select().single()

                if (stRow?.id) createdStudentIds.push({ id: stRow.id, class_id: s.classId })
            }

            // 4. Create Activities
            await supabase.from('activities').insert([
                { name: 'Annual Sports Meet', type: 'sports', description: 'Athletics, football, and relays' },
                { name: 'Science & Robotics Expo', type: 'science', description: 'Student innovation exhibits' },
                { name: 'Inter-School Debate', type: 'club', description: 'Annual parliamentary debate' },
                { name: 'Music & Cultural Fest', type: 'cultural', description: 'Performing arts showcase' },
            ])

            // 5. Create Attendance for today
            const today = new Date().toISOString().split('T')[0]
            if (createdStudentIds.length > 0) {
                const attendanceRecords = createdStudentIds.map((st, idx) => ({
                    student_id: st.id,
                    class_id: st.class_id,
                    date: today,
                    status: idx === 3 ? 'absent' : idx === 5 ? 'late' : 'present'
                }))
                await supabase.from('attendance').insert(attendanceRecords)
            }

            toast.success('Demo data added successfully!', { id: toastId })
            fetchDashboardData()
        } catch (err) {
            console.error('Seed error:', err)
            toast.error(err.message || 'Failed to populate demo data', { id: toastId })
        } finally {
            setSeeding(false)
        }
    }

    const isDatabaseEmpty = !loading && counts.students === 0 && counts.classes === 0 && counts.teachers === 0

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Page Title & Seed Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Dashboard</h1>
                        <p className="text-zinc-500 mt-1">School overview at a glance</p>
                    </div>

                    {isDatabaseEmpty && (
                        <button
                            onClick={seedDemoData}
                            disabled={seeding}
                            className="btn-primary"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>{seeding ? 'Loading Demo Data...' : 'Load Sample Data'}</span>
                        </button>
                    )}
                </div>

                {/* Empty State Banner */}
                {isDatabaseEmpty && (
                    <div className="glass-panel p-6 border-violet-200/60 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20 shrink-0">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-800 tracking-tight">Your school database is ready!</h3>
                                <p className="text-zinc-500 text-sm mt-0.5">
                                    No records have been added yet. You can add your own classes and students, or load sample demo data to see the charts in action.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => navigate('/classes')}
                                className="btn-glass text-xs"
                            >
                                <PlusCircle className="w-4 h-4" /> Add Class
                            </button>
                            <button
                                onClick={seedDemoData}
                                disabled={seeding}
                                className="btn-primary text-xs"
                            >
                                <Sparkles className="w-4 h-4" /> {seeding ? 'Seeding...' : 'Load Sample Data'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div 
                                key={stat.key} 
                                onClick={() => navigate(stat.path)}
                                className="glass-panel p-6 hover:-translate-y-1 hover:shadow-violet-500/10 transition-all cursor-pointer group flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 ${stat.bg} border rounded-2xl flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <ArrowRight className="text-zinc-300 group-hover:text-violet-500 transition-colors w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-zinc-800 tracking-tight">
                                        {loading ? (
                                            <span className="inline-block w-8 h-8 rounded-lg bg-zinc-200/60 animate-pulse align-middle" />
                                        ) : (
                                            counts[stat.key]
                                        )}
                                    </p>
                                    <p className="text-zinc-500 font-medium text-sm mt-1">{stat.label}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart: Students by Class */}
                    <div className="glass-panel p-6 lg:col-span-2">
                        <h2 className="text-lg font-bold text-zinc-800 mb-6 tracking-tight">Student Distribution</h2>
                        {loading ? (
                            <div className="h-80 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : classData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                                        <Tooltip 
                                            cursor={{fill: '#f4f4f5', opacity: 0.5}} 
                                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.1)'}}
                                        />
                                        <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                                            {classData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-zinc-400">
                                <BarChart className="w-12 h-12 mb-3 text-zinc-300" />
                                <p className="font-medium text-zinc-500">No student distribution data</p>
                                <p className="text-xs text-zinc-400 mt-1">Add students and assign them to classes to view charts</p>
                            </div>
                        )}
                    </div>

                    {/* Donut Chart: Attendance Overview */}
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-bold text-zinc-800 mb-2 tracking-tight">Attendance Overview</h2>
                        <p className="text-xs text-zinc-500 mb-6">Based on latest records</p>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : attendanceData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {attendanceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.1)'}}
                                            itemStyle={{fontWeight: 'bold', color: '#27272a'}}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                                <PieChart className="w-12 h-12 mb-3 text-zinc-300" />
                                <p className="font-medium text-zinc-500">No attendance recorded</p>
                                <p className="text-xs text-zinc-400 mt-1">Mark attendance in the Attendance page</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel p-6">
                    <h2 className="text-lg font-bold text-zinc-800 mb-4 tracking-tight">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Add Student', icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50', path: '/students' },
                            { label: 'Mark Attendance', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/attendance' },
                            { label: 'Add Grades', icon: ClipboardSignature, color: 'text-sky-600', bg: 'bg-sky-50', path: '/grades' },
                            { label: 'Collect Fee', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50', path: '/fees' },
                            { label: 'Send Notice', icon: BellRing, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', path: '/communication' },
                        ].map((action) => {
                            const ActionIcon = action.icon;
                            return (
                                <div
                                    key={action.label}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/40 border border-white hover:bg-white/80 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <ActionIcon className={`w-6 h-6 ${action.color}`} />
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700">{action.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
