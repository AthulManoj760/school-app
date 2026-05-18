import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

const stats = [
    { label: 'Total Students', icon: '👨‍🎓', color: 'bg-blue-500', key: 'students', path: '/students' },
    { label: 'Total Teachers', icon: '👨‍🏫', color: 'bg-green-500', key: 'teachers', path: '/teachers' },
    { label: 'Total Classes', icon: '🏫', color: 'bg-purple-500', key: 'classes', path: '/classes' },
    { label: 'Activities', icon: '🏆', color: 'bg-orange-500', key: 'activities', path: '/activities' },
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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
                        { name: 'Present', value: statusCounts['present'] || 0, color: '#10B981' }, // Green
                        { name: 'Absent', value: statusCounts['absent'] || 0, color: '#EF4444' }, // Red
                        { name: 'Late', value: statusCounts['late'] || 0, color: '#F59E0B' }, // Yellow
                        { name: 'Leave', value: statusCounts['leave'] || 0, color: '#3B82F6' }, // Blue
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
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-400 mt-1">School overview at a glance</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat) => (
                                <div 
                                    key={stat.key} 
                                    onClick={() => navigate(stat.path)}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition cursor-pointer group flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                            <span className="text-2xl">{stat.icon}</span>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-blue-500 transition text-xl">→</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-gray-800">{counts[stat.key]}</p>
                                        <p className="text-gray-500 font-medium text-sm mt-1">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Bar Chart: Students by Class */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                                <h2 className="text-lg font-bold text-gray-800 mb-6">Student Distribution</h2>
                                {classData.length > 0 ? (
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                                <Tooltip 
                                                    cursor={{fill: '#f9fafb'}} 
                                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
                                    <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                                        <p className="text-4xl mb-2">📊</p>
                                        <p>No student data available</p>
                                    </div>
                                )}
                            </div>

                            {/* Donut Chart: Attendance Overview */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-2">Attendance Overview</h2>
                                <p className="text-xs text-gray-400 mb-6">Based on latest records</p>
                                {attendanceData.length > 0 ? (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={attendanceData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {attendanceData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                                    itemStyle={{fontWeight: 'bold'}}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                        <p className="text-4xl mb-2">🎯</p>
                                        <p>No attendance recorded yet</p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: 'Add Student', icon: '➕', path: '/students' },
                                    { label: 'Mark Attendance', icon: '✅', path: '/attendance' },
                                    { label: 'Add Grades', icon: '📝', path: '/grades' },
                                    { label: 'Collect Fee', icon: '💰', path: '/fees' },
                                    { label: 'Send Notice', icon: '📢', path: '/communication' },
                                ].map((action) => (
                                    <div
                                        key={action.label}
                                        onClick={() => navigate(action.path)}
                                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl group-hover:bg-white transition">
                                            {action.icon}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}