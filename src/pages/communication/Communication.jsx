import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { Megaphone, Users, GraduationCap, UserSquare2, ShieldCheck, Send, Trash2, Calendar, X, Eye } from 'lucide-react'

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
        all: { label: 'Everyone', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Users },
        student: { label: 'Students', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap },
        teacher: { label: 'Teachers', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: UserSquare2 },
        parent: { label: 'Parents', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Users },
        admin: { label: 'Admins', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldCheck },
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
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Communication</h1>
                        <p className="text-zinc-500 mt-1">Send announcements to students, teachers and parents</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        <Megaphone className="w-5 h-5" />
                        <span>New Announcement</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {Object.entries(roleConfig).map(([role, config]) => {
                        const Icon = config.icon
                        return (
                            <div key={role} className="glass-panel p-4 text-center hover:-translate-y-1 transition-transform">
                                <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-inner ${config.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-zinc-800 tracking-tight">
                                    {role === 'all'
                                        ? announcements.length
                                        : announcements.filter(a => a.target_role === role).length}
                                </p>
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">{config.label}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap glass-panel p-1 border-white/50 w-fit">
                    {Object.entries(roleConfig).map(([role, config]) => {
                        const Icon = config.icon
                        return (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${filterRole === role
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {config.label}
                            </button>
                        )
                    })}
                </div>

                {/* Announcements List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 glass-panel">
                        <Megaphone className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">No announcements yet</p>
                        <p className="text-zinc-400 text-sm mt-1">Click "New Announcement" to send one</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(announcement => {
                            const config = roleConfig[announcement.target_role] || roleConfig.all
                            const Icon = config.icon
                            return (
                                <div key={announcement.id} className="glass-panel p-6 hover:-translate-y-1 transition-transform group flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${config.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                    <h3 className="font-bold text-lg text-zinc-800 tracking-tight">{announcement.title}</h3>
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-600 text-sm leading-relaxed mb-4">{announcement.message}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="text-zinc-300 hover:text-rose-500 hover:bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mt-auto pt-4 border-t border-white/50">
                                            <Calendar className="w-3.5 h-3.5" /> {formatDate(announcement.created_at)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* New Announcement Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-violet-600" />
                                New Announcement
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="input-glass"
                                    placeholder="Holiday Notice / Exam Schedule..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Send To</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(roleConfig).map(([role, config]) => {
                                        const Icon = config.icon
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => setForm({ ...form, target_role: role })}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition flex flex-col items-center justify-center gap-1.5 ${form.target_role === role
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-md ring-2 ring-violet-200 ring-offset-1'
                                                        : 'bg-white/50 text-zinc-600 border-white hover:bg-white'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-xs">{config.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Message *</label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="input-glass"
                                    rows={5}
                                    placeholder="Write your announcement here..."
                                />
                            </div>

                            {/* Preview */}
                            {form.title && form.message && (
                                <div className="bg-violet-50/50 rounded-2xl p-4 border border-violet-100 shadow-inner">
                                    <p className="text-xs text-violet-500 mb-3 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                    </p>
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-white">
                                        <p className="font-bold text-zinc-800 tracking-tight">{form.title}</p>
                                        <p className="text-zinc-600 text-sm mt-2">{form.message}</p>
                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${roleConfig[form.target_role]?.color}`}>
                                                {roleConfig[form.target_role]?.icon && (
                                                    <span className="[&>svg]:w-3 [&>svg]:h-3">
                                                        {roleConfig[form.target_role]?.icon({})}
                                                    </span>
                                                )}
                                                {roleConfig[form.target_role]?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-transparent rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSend} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                <Send className="w-4 h-4" />
                                {saving ? 'Sending...' : 'Send Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}