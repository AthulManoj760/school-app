import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Classes() {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingClass, setEditingClass] = useState(null)
    const [studentCounts, setStudentCounts] = useState({})
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: '',
        section: '',
        academic_year: '2025-2026',
    })

    useEffect(() => {
        fetchClasses()
    }, [])

    const fetchClasses = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('classes')
            .select('*')
            .order('name', { ascending: true })
        setClasses(data || [])

        // Fetch student counts per class
        const counts = {}
        for (const cls of data || []) {
            const { count } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id)
                .eq('status', 'active')
            counts[cls.id] = count || 0
        }
        setStudentCounts(counts)
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!form.name) {
            toast.error('Class name is required')
            return
        }
        setSaving(true)
        try {
            if (editingClass) {
                const { error } = await supabase
                    .from('classes')
                    .update({
                        name: form.name,
                        section: form.section,
                        academic_year: form.academic_year,
                    })
                    .eq('id', editingClass.id)
                if (error) throw error
                toast.success('Class updated!')
            } else {
                const { error } = await supabase.from('classes').insert({
                    name: form.name,
                    section: form.section,
                    academic_year: form.academic_year,
                })
                if (error) throw error
                toast.success('Class created!')
            }
            setShowModal(false)
            setEditingClass(null)
            setForm({ name: '', section: '', academic_year: '2025-2026' })
            fetchClasses()
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleEdit = (cls) => {
        setEditingClass(cls)
        setForm({
            name: cls.name,
            section: cls.section || '',
            academic_year: cls.academic_year || '2025-2026',
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        const count = studentCounts[id] || 0
        if (count > 0) {
            toast.error(`Cannot delete — ${count} students are in this class`)
            return
        }
        const confirmed = window.confirm('Are you sure you want to delete this class?')
        if (!confirmed) return
        const { error } = await supabase.from('classes').delete().eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Class deleted')
            fetchClasses()
        }
    }

    const classColors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500',
        'bg-orange-500', 'bg-pink-500', 'bg-yellow-500',
        'bg-teal-500', 'bg-red-500'
    ]

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
                        <p className="text-gray-400 text-sm mt-1">{classes.length} classes total</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingClass(null)
                            setForm({ name: '', section: '', academic_year: '2025-2026' })
                            setShowModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <span>➕</span> Add Class
                    </button>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <p className="text-5xl mb-4">🏫</p>
                        <p className="text-gray-500 font-medium">No classes yet</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first class to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((cls, index) => (
                            <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                                {/* Color Bar */}
                                <div className={`h-2 ${classColors[index % classColors.length]}`}></div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {cls.name} {cls.section && <span className="text-blue-600">{cls.section}</span>}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-0.5">
                                                📅 {cls.academic_year || 'N/A'}
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 ${classColors[index % classColors.length]} rounded-xl flex items-center justify-center`}>
                                            <span className="text-white font-bold text-lg">
                                                {cls.name?.replace(/[^0-9]/g, '') || cls.name?.charAt(0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 py-3 border-t border-gray-50">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-800">{studentCounts[cls.id] || 0}</p>
                                            <p className="text-xs text-gray-400">Students</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => navigate(`/students?class=${cls.id}`)}
                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition"
                                        >
                                            👨‍🎓 View Students
                                        </button>
                                        <button
                                            onClick={() => handleEdit(cls)}
                                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-100 transition"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cls.id)}
                                            className="px-3 py-2 bg-red-50 text-red-400 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                        >
                                            🗑️
                                        </button>
                                    </div>
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
                                {editingClass ? 'Edit Class' : 'Add New Class'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Class 10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <input
                                    type="text"
                                    value={form.section}
                                    onChange={e => setForm({ ...form, section: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="A / B / C"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                <input
                                    type="text"
                                    value={form.academic_year}
                                    onChange={e => setForm({ ...form, academic_year: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="2025-2026"
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
                                {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Add Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}