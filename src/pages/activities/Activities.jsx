import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Activities() {
    const [activities, setActivities] = useState([])
    const [studentActivities, setStudentActivities] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [viewMode, setViewMode] = useState('activities')
    const [showActivityModal, setShowActivityModal] = useState(false)
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState(null)
    const [saving, setSaving] = useState(false)

    const [activityForm, setActivityForm] = useState({
        name: '',
        type: '',
        description: '',
        date: '',
    })

    const [enrollForm, setEnrollForm] = useState({
        student_id: '',
        activity_id: '',
        role: '',
        achievement: '',
    })

    useEffect(() => {
        fetchActivities()
        fetchStudentActivities()
        fetchStudents()
    }, [])

    const fetchActivities = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })
        setActivities(data || [])
        setLoading(false)
    }

    const fetchStudentActivities = async () => {
        const { data } = await supabase
            .from('student_activities')
            .select(`
        *,
        students(profiles(full_name), roll_number),
        activities(name, type)
      `)
            .order('created_at', { ascending: false })
        setStudentActivities(data || [])
    }

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('*, profiles(full_name)')
            .eq('status', 'active')
        setStudents(data || [])
    }

    const handleAddActivity = async () => {
        if (!activityForm.name || !activityForm.type) {
            toast.error('Activity name and type are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('activities').insert({
                name: activityForm.name,
                type: activityForm.type,
                description: activityForm.description,
                date: activityForm.date || null,
            })
            if (error) throw error
            toast.success('Activity created!')
            setShowActivityModal(false)
            fetchActivities()
            setActivityForm({ name: '', type: '', description: '', date: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleEnrollStudent = async () => {
        if (!enrollForm.student_id || !enrollForm.activity_id) {
            toast.error('Student and activity are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('student_activities').insert({
                student_id: enrollForm.student_id,
                activity_id: enrollForm.activity_id,
                role: enrollForm.role,
                achievement: enrollForm.achievement,
            })
            if (error) throw error

            // Add to student timeline
            const activity = activities.find(a => a.id === enrollForm.activity_id)
            await supabase.from('student_timeline').insert({
                student_id: enrollForm.student_id,
                event_type: 'Activity Participation',
                description: `Participated in ${activity?.name}${enrollForm.role ? ` as ${enrollForm.role}` : ''}${enrollForm.achievement ? `. Achievement: ${enrollForm.achievement}` : ''}`,
            })

            toast.success('Student enrolled in activity!')
            setShowEnrollModal(false)
            fetchStudentActivities()
            setEnrollForm({ student_id: '', activity_id: '', role: '', achievement: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const activityTypeConfig = {
        sports: { color: 'bg-green-100 text-green-700', icon: '⚽' },
        arts: { color: 'bg-purple-100 text-purple-700', icon: '🎨' },
        music: { color: 'bg-blue-100 text-blue-700', icon: '🎵' },
        science: { color: 'bg-yellow-100 text-yellow-700', icon: '🔬' },
        club: { color: 'bg-orange-100 text-orange-700', icon: '🏛️' },
        cultural: { color: 'bg-pink-100 text-pink-700', icon: '🎭' },
        other: { color: 'bg-gray-100 text-gray-700', icon: '🌟' },
    }

    const getTypeConfig = (type) => activityTypeConfig[type] || activityTypeConfig.other

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Activities & Clubs</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage extracurricular activities</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            👤 Enroll Student
                        </button>
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            ➕ New Activity
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {Object.entries(activityTypeConfig).slice(0, 4).map(([type, config]) => (
                        <div key={type} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                            <span className="text-2xl">{config.icon}</span>
                            <p className="text-xl font-bold text-gray-800 mt-2">
                                {activities.filter(a => a.type === type).length}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{type}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('activities')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'activities' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                        🏆 Activities
                    </button>
                    <button
                        onClick={() => setViewMode('enrollments')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'enrollments' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                        👥 Enrollments
                    </button>
                </div>

                {/* Activities Tab */}
                {viewMode === 'activities' && (
                    loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                            <p className="text-4xl mb-3">🏆</p>
                            <p className="text-gray-500 font-medium">No activities yet</p>
                            <p className="text-gray-400 text-sm mt-1">Click "New Activity" to create one</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activities.map(activity => {
                                const config = getTypeConfig(activity.type)
                                const enrollCount = studentActivities.filter(sa => sa.activity_id === activity.id).length
                                return (
                                    <div key={activity.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-3xl">{config.icon}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${config.color}`}>
                                                {activity.type}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 mb-1">{activity.name}</h3>
                                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{activity.description || 'No description'}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                                            <span>👥 {enrollCount} enrolled</span>
                                            <span>📅 {activity.date || 'No date'}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEnrollForm({ ...enrollForm, activity_id: activity.id })
                                                setShowEnrollModal(true)
                                            }}
                                            className="w-full mt-3 py-2 border border-blue-200 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-50 transition"
                                        >
                                            + Enroll Student
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* Enrollments Tab */}
                {viewMode === 'enrollments' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Student Enrollments</h2>
                        </div>
                        {studentActivities.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">👥</p>
                                <p className="text-gray-500">No enrollments yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Activity</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Type</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Achievement</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentActivities.map((sa, i) => {
                                            const config = getTypeConfig(sa.activities?.type)
                                            return (
                                                <tr key={sa.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-gray-800">{sa.students?.profiles?.full_name}</p>
                                                        <p className="text-xs text-gray-400">Roll: {sa.students?.roll_number || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-gray-700">{sa.activities?.name}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${config.color}`}>
                                                            {sa.activities?.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500">{sa.role || 'Participant'}</td>
                                                    <td className="px-5 py-3">
                                                        {sa.achievement ? (
                                                            <span className="text-yellow-600 font-medium">🏅 {sa.achievement}</span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
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
            </div>

            {/* New Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Create Activity</h2>
                            <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name *</label>
                                <input
                                    type="text"
                                    value={activityForm.name}
                                    onChange={e => setActivityForm({ ...activityForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Annual Sports Day"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    value={activityForm.type}
                                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select type...</option>
                                    <option value="sports">Sports</option>
                                    <option value="arts">Arts</option>
                                    <option value="music">Music</option>
                                    <option value="science">Science</option>
                                    <option value="club">Club</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={activityForm.date}
                                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={activityForm.description}
                                    onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={3}
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowActivityModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddActivity} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Creating...' : 'Create Activity'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enroll Student Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Enroll Student</h2>
                            <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity *</label>
                                <select
                                    value={enrollForm.activity_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, activity_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select activity...</option>
                                    {activities.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                                <select
                                    value={enrollForm.student_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    value={enrollForm.role}
                                    onChange={e => setEnrollForm({ ...enrollForm, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Captain / Participant / Lead..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Achievement</label>
                                <input
                                    type="text"
                                    value={enrollForm.achievement}
                                    onChange={e => setEnrollForm({ ...enrollForm, achievement: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="1st Place / Best Actor / Gold Medal..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowEnrollModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleEnrollStudent} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Enrolling...' : 'Enroll Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}