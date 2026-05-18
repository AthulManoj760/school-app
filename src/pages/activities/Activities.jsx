import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { Trophy, Users, Plus, UserPlus, Calendar, Medal, Activity, Music, Palette, FlaskConical, Building, Tent, Sparkles, X } from 'lucide-react'

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
        sports: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Activity },
        arts: { color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', icon: Palette },
        music: { color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Music },
        science: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FlaskConical },
        club: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Building },
        cultural: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Tent },
        other: { color: 'bg-zinc-50 text-zinc-700 border-zinc-200', icon: Sparkles },
    }

    const getTypeConfig = (type) => activityTypeConfig[type] || activityTypeConfig.other

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Activities & Clubs</h1>
                        <p className="text-zinc-500 mt-1">Manage extracurricular activities</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="btn-glass px-4 py-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span className="hidden sm:inline">Enroll Student</span>
                        </button>
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="btn-primary"
                        >
                            <Trophy className="w-5 h-5" />
                            <span>New Activity</span>
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(activityTypeConfig).slice(0, 4).map(([type, config]) => {
                        const Icon = config.icon;
                        return (
                            <div key={type} className="glass-panel p-4 text-center hover:-translate-y-1 transition-transform">
                                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner ${config.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <p className="text-2xl font-bold text-zinc-800 tracking-tight">
                                    {activities.filter(a => a.type === type).length}
                                </p>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">{type}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 glass-panel p-1 w-fit border-white/50">
                    <button
                        onClick={() => setViewMode('activities')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'activities' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <Trophy className="w-4 h-4" /> Activities
                    </button>
                    <button
                        onClick={() => setViewMode('enrollments')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'enrollments' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <Users className="w-4 h-4" /> Enrollments
                    </button>
                </div>

                {/* Activities Tab */}
                {viewMode === 'activities' && (
                    loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-16 glass-panel">
                            <Trophy className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                            <p className="text-zinc-500 font-medium">No activities yet</p>
                            <p className="text-zinc-400 text-sm mt-1">Click "New Activity" to create one</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activities.map(activity => {
                                const config = getTypeConfig(activity.type)
                                const Icon = config.icon
                                const enrollCount = studentActivities.filter(sa => sa.activity_id === activity.id).length
                                return (
                                    <div key={activity.id} className="glass-panel p-5 hover:-translate-y-1 hover:shadow-violet-500/10 flex flex-col group transition-all duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${config.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider border ${config.color}`}>
                                                {activity.type}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-800 tracking-tight mb-2">{activity.name}</h3>
                                        <p className="text-sm text-zinc-500 mb-4 line-clamp-2 flex-1">{activity.description || 'No description'}</p>
                                        
                                        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 pt-4 border-t border-white/50 mt-auto">
                                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {enrollCount} enrolled</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {activity.date || 'No date'}</span>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                setEnrollForm({ ...enrollForm, activity_id: activity.id })
                                                setShowEnrollModal(true)
                                            }}
                                            className="w-full mt-4 py-2.5 bg-white hover:bg-violet-50 text-violet-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm border border-transparent hover:border-violet-100 opacity-100 lg:opacity-0 group-hover:opacity-100"
                                        >
                                            <UserPlus className="w-4 h-4" /> Enroll Student
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* Enrollments Tab */}
                {viewMode === 'enrollments' && (
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-sm">
                            <h2 className="font-bold text-zinc-800 tracking-tight">Student Enrollments</h2>
                        </div>
                        {studentActivities.length === 0 ? (
                            <div className="text-center py-16">
                                <Users className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-500">No enrollments yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/40 border-b border-white">
                                        <tr>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Student</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Activity</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Type</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Role</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Achievement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/50">
                                        {studentActivities.map((sa) => {
                                            const config = getTypeConfig(sa.activities?.type)
                                            return (
                                                <tr key={sa.id} className="hover:bg-white/40 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-zinc-800">{sa.students?.profiles?.full_name}</p>
                                                        <p className="text-xs text-zinc-500">Roll: {sa.students?.roll_number || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-zinc-700 tracking-tight">{sa.activities?.name}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${config.color}`}>
                                                            {sa.activities?.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-zinc-600 font-medium">{sa.role || 'Participant'}</td>
                                                    <td className="px-5 py-4">
                                                        {sa.achievement ? (
                                                            <span className="text-yellow-600 font-semibold flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg w-fit border border-yellow-200"><Medal className="w-4 h-4" /> {sa.achievement}</span>
                                                        ) : (
                                                            <span className="text-zinc-400">—</span>
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
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-violet-600" />
                                Create Activity
                            </h2>
                            <button onClick={() => setShowActivityModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Activity Name *</label>
                                <input
                                    type="text"
                                    value={activityForm.name}
                                    onChange={e => setActivityForm({ ...activityForm, name: e.target.value })}
                                    className="input-glass"
                                    placeholder="Annual Sports Day"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Type *</label>
                                <select
                                    value={activityForm.type}
                                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                    className="input-glass"
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
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={activityForm.date}
                                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
                                <textarea
                                    value={activityForm.description}
                                    onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                                    className="input-glass"
                                    rows={3}
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowActivityModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200">
                                Cancel
                            </button>
                            <button onClick={handleAddActivity} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Creating...' : 'Create Activity'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enroll Student Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-violet-600" />
                                Enroll Student
                            </h2>
                            <button onClick={() => setShowEnrollModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Activity *</label>
                                <select
                                    value={enrollForm.activity_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, activity_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select activity...</option>
                                    {activities.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Student *</label>
                                <select
                                    value={enrollForm.student_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
                                <input
                                    type="text"
                                    value={enrollForm.role}
                                    onChange={e => setEnrollForm({ ...enrollForm, role: e.target.value })}
                                    className="input-glass"
                                    placeholder="Captain / Participant / Lead..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Achievement</label>
                                <input
                                    type="text"
                                    value={enrollForm.achievement}
                                    onChange={e => setEnrollForm({ ...enrollForm, achievement: e.target.value })}
                                    className="input-glass"
                                    placeholder="1st Place / Best Actor / Gold Medal..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowEnrollModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200">
                                Cancel
                            </button>
                            <button onClick={handleEnrollStudent} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Enrolling...' : 'Enroll Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}