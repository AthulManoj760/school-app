import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

const stats = [
    { label: 'Total Students', icon: '👨‍🎓', color: 'bg-blue-500', key: 'students' },
    { label: 'Total Teachers', icon: '👨‍🏫', color: 'bg-green-500', key: 'teachers' },
    { label: 'Total Classes', icon: '🏫', color: 'bg-purple-500', key: 'classes' },
    { label: 'Activities', icon: '🏆', color: 'bg-orange-500', key: 'activities' },
]

export default function Dashboard() {
    const [counts, setCounts] = useState({
        students: 0,
        teachers: 0,
        classes: 0,
        activities: 0,
    })

    useEffect(() => {
        const fetchCounts = async () => {
            const [students, teachers, classes, activities] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('classes').select('*', { count: 'exact', head: true }),
                supabase.from('activities').select('*', { count: 'exact', head: true }),
            ])
            setCounts({
                students: students.count || 0,
                teachers: teachers.count || 0,
                classes: classes.count || 0,
                activities: activities.count || 0,
            })
        }
        fetchCounts()
    }, [])

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-400 mt-1">School overview at a glance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                                <span className="text-2xl">{stat.icon}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{counts[stat.key]}</p>
                            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Add Student', icon: '➕', path: '/students' },
                            { label: 'Mark Attendance', icon: '✅', path: '/attendance' },
                            { label: 'Add Grades', icon: '📝', path: '/grades' },
                            { label: 'Collect Fee', icon: '💰', path: '/fees' },
                        ].map((action) => (
                            <a
                                key={action.label}
                                href={action.path}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-sm font-medium text-gray-600">{action.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </Layout >
    )
}