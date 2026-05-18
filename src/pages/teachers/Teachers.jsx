import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { UserPlus, Search, UserCircle, Phone, GraduationCap, CalendarDays, Edit, Trash2, X } from 'lucide-react'

export default function Teachers() {
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState(null)
    const [search, setSearch] = useState('')

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        subject: '',
        qualification: '',
        joining_date: '',
    })

    useEffect(() => {
        fetchTeachers()
    }, [])

    const fetchTeachers = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('teachers')
            .select('*, profiles(full_name, phone, photo_url)')
            .order('created_at', { ascending: false })
        setTeachers(data || [])
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!form.full_name) {
            toast.error('Teacher name is required')
            return
        }
        setSaving(true)
        try {
            if (editingTeacher) {
                // Update profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: form.full_name,
                        phone: form.phone,
                    })
                    .eq('id', editingTeacher.profile_id)
                if (profileError) throw profileError

                // Update teacher
                const { error: teacherError } = await supabase
                    .from('teachers')
                    .update({
                        subject: form.subject,
                        qualification: form.qualification,
                        joining_date: form.joining_date || null,
                    })
                    .eq('id', editingTeacher.id)
                if (teacherError) throw teacherError
                toast.success('Teacher updated!')
            } else {
                // Create profile
                const profileId = crypto.randomUUID()
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: profileId,
                        full_name: form.full_name,
                        phone: form.phone,
                        role: 'teacher',
                    })
                if (profileError) throw profileError

                // Create teacher
                const { error: teacherError } = await supabase
                    .from('teachers')
                    .insert({
                        profile_id: profileId,
                        subject: form.subject,
                        qualification: form.qualification,
                        joining_date: form.joining_date || null,
                    })
                if (teacherError) throw teacherError
                toast.success('Teacher added!')
            }

            setShowModal(false)
            setEditingTeacher(null)
            setForm({ full_name: '', phone: '', subject: '', qualification: '', joining_date: '' })
            fetchTeachers()
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher)
        setForm({
            full_name: teacher.profiles?.full_name || '',
            phone: teacher.profiles?.phone || '',
            subject: teacher.subject || '',
            qualification: teacher.qualification || '',
            joining_date: teacher.joining_date || '',
        })
        setShowModal(true)
    }

    const handleDelete = async (teacher) => {
        const confirmed = window.confirm(`Delete ${teacher.profiles?.full_name}? This cannot be undone.`)
        if (!confirmed) return
        try {
            const { error: teacherError } = await supabase
                .from('teachers')
                .delete()
                .eq('id', teacher.id)
            if (teacherError) throw teacherError

            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', teacher.profile_id)
            if (profileError) throw profileError

            toast.success('Teacher deleted')
            fetchTeachers()
        } catch (err) {
            toast.error(err.message)
        }
    }

    const filtered = teachers.filter(t => {
        const name = t.profiles?.full_name?.toLowerCase() || ''
        const subject = t.subject?.toLowerCase() || ''
        return name.includes(search.toLowerCase()) || subject.includes(search.toLowerCase())
    })

    const avatarColors = [
        'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500',
        'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
        'bg-indigo-500', 'bg-pink-500'
    ]

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Teachers</h1>
                        <p className="text-zinc-500 mt-1">{teachers.length} teachers total</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingTeacher(null)
                            setForm({ full_name: '', phone: '', subject: '', qualification: '', joining_date: '' })
                            setShowModal(true)
                        }}
                        className="btn-primary"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Add Teacher</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search by name or subject..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input-glass pl-10"
                    />
                </div>

                {/* Teachers Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 glass-panel">
                        <UserCircle className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">No teachers found</p>
                        <p className="text-zinc-400 text-sm mt-1">Add your first teacher to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((teacher, index) => (
                            <div key={teacher.id} className="glass-panel p-5 hover:-translate-y-1 hover:shadow-violet-500/10 cursor-pointer group flex flex-col transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 ${avatarColors[index % avatarColors.length]} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0`}>
                                            {teacher.profiles?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-800 tracking-tight">{teacher.profiles?.full_name}</h3>
                                            <span className="badge-glass-violet mt-1 inline-block">{teacher.subject || 'No subject'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 pt-4 border-t border-white/50 space-y-3 text-sm text-zinc-500">
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                        <span>{teacher.profiles?.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="w-4 h-4 text-zinc-400" />
                                        <span>{teacher.qualification || 'No qualification'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="w-4 h-4 text-zinc-400" />
                                        <span>Joined: {teacher.joining_date || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(teacher)}
                                        className="flex-1 py-2 bg-white hover:bg-violet-50 text-violet-600 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 shadow-sm border border-transparent hover:border-violet-100"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(teacher)}
                                        className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-500 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 shadow-sm border border-transparent hover:border-rose-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight">
                                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full Name *</label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    className="input-glass"
                                    placeholder="John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="input-glass"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="input-glass"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Qualification</label>
                                <input
                                    type="text"
                                    value={form.qualification}
                                    onChange={e => setForm({ ...form, qualification: e.target.value })}
                                    className="input-glass"
                                    placeholder="B.Ed, M.Sc Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Joining Date</label>
                                <input
                                    type="date"
                                    value={form.joining_date}
                                    onChange={e => setForm({ ...form, joining_date: e.target.value })}
                                    className="input-glass"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 btn-primary py-2.5"
                            >
                                {saving ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}