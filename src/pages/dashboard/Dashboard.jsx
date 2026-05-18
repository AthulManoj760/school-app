import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    Users, UserCircle, Building2, Award, UserPlus,
    CalendarCheck, ClipboardSignature, Wallet, BellRing, ArrowRight
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
    const [counts, setCounts] = useState({
        students: 0,
        teachers: 0,
        classes: 0,
        activities: 0,
    })
    const [classData, setClassData] = useState([])
    const [attendanceData, setAttendanceData] = useState([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                // 1. Fetch counts
                const [students, teachers, classesRes, activities] = await Promise.all([
                    supabase.from('students').select('*', { count: 'exact', head: true }),
                    supabase.from('teachers').select('*', { count: 'exact', head: true }),
                    supabase.from('classes').select('id, name, section'),
                    supabase.from('activities').select('*', { count: 'exact', head: true }),
                ])
                setCounts({
                    students: students.count || 0,
                    teachers: teachers.count || 0,
                    classes: classesRes.data?.length || 0,
                    activities: activities.count || 0,
                })

                // 2. Fetch students for class distribution
                const { data: allStudents } = await supabase.from('students').select('class_id, status').eq('status', 'active')
                
                if (classesRes.data && allStudents) {
                    const classCounts = classesRes.data.map(c => {
                        const count = allStudents.filter(s => s.class_id === c.id).length
                        return {
                            name: `${c.name} ${c.section || ''}`.trim(),
                            students: count
                        }
                    }).filter(c => c.students > 0)
                      .sort((a, b) => b.students - a.students) // Sort by student count
                    
                    setClassData(classCounts)
                }

                // 3. Fetch today's attendance (or latest date if no attendance today)
                const today = new Date().toISOString().split('T')[0]
                let { data: attendance } = await supabase.from('attendance').select('status').eq('date', today)
                
                // If no attendance today, fetch the most recent attendance date
                if (!attendance || attendance.length === 0) {
                     const { data: latestRecord } = await supabase
                        .from('attendance')
                        .select('date')
                        .order('date', { ascending: false })
                        .limit(1)
                        
                     if (latestRecord && latestRecord.length > 0) {
                         const latestDate = latestRecord[0].date
                         const { data: latestAttendance } = await supabase.from('attendance').select('status').eq('date', latestDate)
                         attendance = latestAttendance
                     }
                }

                if (attendance && attendance.length > 0) {
                    const statusCounts = attendance.reduce((acc, curr) => {
                        acc[curr.status] = (acc[curr.status] || 0) + 1
                        return acc
                    }, {})

                    setAttendanceData([
                        { name: 'Present', value: statusCounts['present'] || 0, color: '#10b981' }, // Emerald
                        { name: 'Absent', value: statusCounts['absent'] || 0, color: '#f43f5e' }, // Rose
                        { name: 'Late', value: statusCounts['late'] || 0, color: '#f59e0b' }, // Amber
                        { name: 'Leave', value: statusCounts['leave'] || 0, color: '#8b5cf6' }, // Violet
                    ].filter(item => item.value > 0))
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Page Title */}
                <div>
                    <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Dashboard</h1>
                    <p className="text-zinc-500 mt-1">School overview at a glance</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
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
                                            <p className="text-4xl font-bold text-zinc-800 tracking-tight">{counts[stat.key]}</p>
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
                                {classData.length > 0 ? (
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
                                        <p>No student data available</p>
                                    </div>
                                )}
                            </div>

                            {/* Donut Chart: Attendance Overview */}
                            <div className="glass-panel p-6">
                                <h2 className="text-lg font-bold text-zinc-800 mb-2 tracking-tight">Attendance Overview</h2>
                                <p className="text-xs text-zinc-500 mb-6">Based on latest records</p>
                                {attendanceData.length > 0 ? (
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
                                        <p>No attendance recorded yet</p>
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
                    </>
                )}
            </div>
        </Layout>
    )
}