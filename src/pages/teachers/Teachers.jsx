import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

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
        'bg-blue-500', 'bg-green-500', 'bg-purple-500',
        'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
    ]

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
                        <p className="text-gray-400 text-sm mt-1">{teachers.length} teachers total</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingTeacher(null)
                            setForm({ full_name: '', phone: '', subject: '', qualification: '', joining_date: '' })
                            setShowModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <span>➕</span> Add Teacher
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or subject..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                </div>

                {/* Teachers Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <p className="text-5xl mb-4">👨‍🏫</p>
                        <p className="text-gray-500 font-medium">No teachers found</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first teacher to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((teacher, index) => (
                            <div key={teacher.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 ${avatarColors[index % avatarColors.length]} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                            {teacher.profiles?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{teacher.profiles?.full_name}</h3>
                                            <p className="text-sm text-blue-600 font-medium">{teacher.subject || 'No subject'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span>📞</span>
                                        <span>{teacher.profiles?.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🎓</span>
                                        <span>{teacher.qualification || 'No qualification'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📅</span>
                                        <span>Joined: {teacher.joining_date || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-gray-50">
                                    <button
                                        onClick={() => handleEdit(teacher)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(teacher)}
                                        className="flex-1 py-2 bg-red-50 text-red-400 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                                <input
                                    type="text"
                                    value={form.qualification}
                                    onChange={e => setForm({ ...form, qualification: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="B.Ed, M.Sc Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                                <input
                                    type="date"
                                    value={form.joining_date}
                                    onChange={e => setForm({ ...form, joining_date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm"
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