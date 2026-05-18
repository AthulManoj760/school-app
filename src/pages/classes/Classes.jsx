import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { Plus, Building2, Users, Edit, Trash2, CalendarDays, X } from 'lucide-react'

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
        'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500',
        'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
        'bg-indigo-500', 'bg-pink-500'
    ]

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Classes</h1>
                        <p className="text-zinc-500 mt-1">{classes.length} classes total</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingClass(null)
                            setForm({ name: '', section: '', academic_year: '2025-2026' })
                            setShowModal(true)
                        }}
                        className="btn-primary"
                    >
                        <Building2 className="w-5 h-5" />
                        <span>Add Class</span>
                    </button>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-20 glass-panel">
                        <Building2 className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">No classes yet</p>
                        <p className="text-zinc-400 text-sm mt-1">Add your first class to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls, index) => (
                            <div key={cls.id} className="glass-panel overflow-hidden hover:-translate-y-1 hover:shadow-violet-500/10 transition-all duration-300 flex flex-col group">
                                {/* Color Bar */}
                                <div className={`h-1.5 w-full ${classColors[index % classColors.length]}`}></div>
                                
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-800 tracking-tight">
                                                {cls.name} {cls.section && <span className="text-violet-600 ml-1">{cls.section}</span>}
                                            </h3>
                                            <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                                                <CalendarDays className="w-4 h-4" /> {cls.academic_year || 'N/A'}
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 ${classColors[index % classColors.length]} rounded-2xl flex items-center justify-center shadow-inner`}>
                                            <span className="text-white font-bold text-lg">
                                                {cls.name?.replace(/[^0-9]/g, '') || cls.name?.charAt(0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 py-4 my-auto border-y border-white/50">
                                        <div className="text-center w-full">
                                            <p className="text-3xl font-bold text-zinc-800 tracking-tight">{studentCounts[cls.id] || 0}</p>
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Students Enrolled</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/students?class=${cls.id}`)}
                                            className="flex-1 py-2 bg-white hover:bg-violet-50 text-violet-600 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-transparent hover:border-violet-100"
                                        >
                                            <Users className="w-3.5 h-3.5" /> View Students
                                        </button>
                                        <button
                                            onClick={() => handleEdit(cls)}
                                            className="px-3 py-2 bg-white text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg text-xs font-medium transition-colors shadow-sm border border-transparent hover:border-violet-100"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cls.id)}
                                            className="px-3 py-2 bg-white text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors shadow-sm border border-transparent hover:border-rose-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight">
                                {editingClass ? 'Edit Class' : 'Add New Class'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="input-glass"
                                    placeholder="Class 10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Section</label>
                                <input
                                    type="text"
                                    value={form.section}
                                    onChange={e => setForm({ ...form, section: e.target.value })}
                                    className="input-glass"
                                    placeholder="A / B / C"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Academic Year</label>
                                <input
                                    type="text"
                                    value={form.academic_year}
                                    onChange={e => setForm({ ...form, academic_year: e.target.value })}
                                    className="input-glass"
                                    placeholder="2025-2026"
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
                                {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Add Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}