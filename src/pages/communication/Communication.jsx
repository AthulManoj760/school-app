import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Communication() {
    const { user } = useAuth()
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [filterRole, setFilterRole] = useState('all')
    const [form, setForm] = useState({
        title: '',
        message: '',
        target_role: 'all',
    })

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
        setAnnouncements(data || [])
        setLoading(false)
    }

    const handleSend = async () => {
        if (!form.title || !form.message) {
            toast.error('Title and message are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('announcements').insert({
                title: form.title,
                message: form.message,
                target_role: form.target_role,
                created_by: user?.id,
            })
            if (error) throw error
            toast.success('Announcement sent!')
            setShowModal(false)
            fetchAnnouncements()
            setForm({ title: '', message: '', target_role: 'all' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Announcement deleted')
            fetchAnnouncements()
        }
    }

    const roleConfig = {
        all: { label: 'Everyone', color: 'bg-blue-100 text-blue-700', icon: '📢' },
        student: { label: 'Students', color: 'bg-green-100 text-green-700', icon: '👨‍🎓' },
        teacher: { label: 'Teachers', color: 'bg-purple-100 text-purple-700', icon: '👨‍🏫' },
        parent: { label: 'Parents', color: 'bg-orange-100 text-orange-700', icon: '👨‍👩‍👧' },
        admin: { label: 'Admins', color: 'bg-red-100 text-red-700', icon: '👑' },
    }

    const filtered = filterRole === 'all'
        ? announcements
        : announcements.filter(a => a.target_role === filterRole)

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Communication</h1>
                        <p className="text-gray-400 text-sm mt-1">Send announcements to students, teachers and parents</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <span>📢</span> New Announcement
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {Object.entries(roleConfig).slice(0, 4).map(([role, config]) => (
                        <div key={role} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                            <span className="text-2xl">{config.icon}</span>
                            <p className="text-xl font-bold text-gray-800 mt-2">
                                {role === 'all'
                                    ? announcements.length
                                    : announcements.filter(a => a.target_role === role).length}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{config.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {Object.entries(roleConfig).map(([role, config]) => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${filterRole === role
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>{config.icon}</span>
                            {config.label}
                        </button>
                    ))}
                </div>

                {/* Announcements List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-4xl mb-3">📢</p>
                        <p className="text-gray-500 font-medium">No announcements yet</p>
                        <p className="text-gray-400 text-sm mt-1">Click "New Announcement" to send one</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(announcement => {
                            const config = roleConfig[announcement.target_role] || roleConfig.all
                            return (
                                <div key={announcement.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                                                    {config.icon} {config.label}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed">{announcement.message}</p>
                                            <p className="text-gray-400 text-xs mt-3">
                                                📅 {formatDate(announcement.created_at)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="text-gray-300 hover:text-red-400 transition flex-shrink-0 text-xl"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* New Announcement Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">New Announcement</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Holiday Notice / Exam Schedule..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(roleConfig).map(([role, config]) => (
                                        <button
                                            key={role}
                                            onClick={() => setForm({ ...form, target_role: role })}
                                            className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-1.5 ${form.target_role === role
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{config.icon}</span>
                                            <span className="text-xs">{config.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={5}
                                    placeholder="Write your announcement here..."
                                />
                            </div>

                            {/* Preview */}
                            {form.title && form.message && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Preview</p>
                                    <p className="font-semibold text-gray-800 text-sm">{form.title}</p>
                                    <p className="text-gray-600 text-sm mt-1">{form.message}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig[form.target_role]?.color}`}>
                                            {roleConfig[form.target_role]?.icon} {roleConfig[form.target_role]?.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSend} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Sending...' : '📢 Send Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}