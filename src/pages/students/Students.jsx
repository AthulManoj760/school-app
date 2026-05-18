import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import {
    UserPlus, Search, GraduationCap, Edit, Trash2, Building2, Phone, X
} from 'lucide-react'

export default function Students() {
    const [students, setStudents] = useState([])
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)
    const navigate = useNavigate()

    const handleDelete = async (e, student) => {
        e.stopPropagation()
        const confirmed = window.confirm(`Delete ${student.profiles?.full_name}? This cannot be undone.`)
        if (!confirmed) return
        
        try {
            const { error: studentError } = await supabase
                .from('students')
                .delete()
                .eq('id', student.id)
            if (studentError) throw studentError

            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', student.profile_id)
            if (profileError) throw profileError

            toast.success('Student deleted')
            fetchStudents()
        } catch (err) {
            toast.error(err.message)
        }
    }

    useEffect(() => {
        fetchStudents()
        fetchClasses()
    }, [])

    const fetchStudents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('students')
            .select(`
        *,
        profiles(full_name, photo_url, phone),
        classes(name, section)
      `)
            .order('created_at', { ascending: false })
        if (error) toast.error('Failed to fetch students')
        else setStudents(data || [])
        setLoading(false)
    }

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*')
        setClasses(data || [])
    }

    const filtered = students.filter(s => {
        const name = s.profiles?.full_name?.toLowerCase() || ''
        const roll = s.roll_number?.toLowerCase() || ''
        const matchSearch = name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase())
        const matchClass = filterClass ? s.class_id === filterClass : true
        return matchSearch && matchClass
    })

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Students</h1>
                        <p className="text-zinc-500 mt-1">{students.length} total students enrolled</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingStudent(null)
                            setShowModal(true)
                        }}
                        className="btn-primary"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Add Student</span>
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search by name or roll number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-glass pl-10"
                        />
                    </div>
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="input-glass sm:w-48"
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                        ))}
                    </select>
                </div>

                {/* Students Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 glass-panel">
                        <GraduationCap className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">No students found</p>
                        <p className="text-zinc-400 text-sm mt-1">Add your first student to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(student => (
                            <div
                                key={student.id}
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="glass-panel p-5 hover:-translate-y-1 hover:shadow-violet-500/10 cursor-pointer group flex flex-col transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-xl font-bold text-violet-600 shrink-0 shadow-inner">
                                        {student.profiles?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-zinc-800 truncate">
                                            {student.profiles?.full_name || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-zinc-400 mb-2">
                                            Roll: {student.roll_number || 'N/A'}
                                        </p>
                                        <span className={student.status === 'active' ? 'badge-glass-green' : 'badge-glass-red'}>
                                            {student.status}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mt-5 pt-4 border-t border-white/50 flex flex-col gap-2 text-sm text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-zinc-400" />
                                        <span>{student.classes?.name} {student.classes?.section || 'No Class'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                        <span>{student.profiles?.phone || 'No Phone'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-auto pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingStudent(student)
                                            setShowModal(true)
                                        }}
                                        className="flex-1 py-2 bg-white hover:bg-violet-50 text-violet-600 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, student)}
                                        className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-500 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Student Modal */}
            {showModal && (
                <StudentModal
                    classes={classes}
                    editingStudent={editingStudent}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false)
                        fetchStudents()
                    }}
                />
            )}
        </Layout>
    )
}

function StudentModal({ classes, editingStudent, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        full_name: editingStudent?.profiles?.full_name || '',
        phone: editingStudent?.profiles?.phone || '',
        email: '',
        password: '',
        roll_number: editingStudent?.roll_number || '',
        class_id: editingStudent?.class_id || '',
        date_of_birth: editingStudent?.date_of_birth || '',
        gender: editingStudent?.gender || '',
        blood_group: editingStudent?.blood_group || '',
        address: editingStudent?.address || '',
        medical_notes: editingStudent?.medical_notes || '',
        emergency_contact: editingStudent?.emergency_contact || '',
        emergency_phone: editingStudent?.emergency_phone || '',
    })

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        if (!form.full_name) {
            toast.error('Student name is required')
            return
        }
        setLoading(true)
        try {
            if (editingStudent) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: form.full_name,
                        phone: form.phone,
                    })
                    .eq('id', editingStudent.profile_id)
                if (profileError) throw profileError

                const { error: studentError } = await supabase
                    .from('students')
                    .update({
                        class_id: form.class_id || null,
                        roll_number: form.roll_number,
                        date_of_birth: form.date_of_birth || null,
                        gender: form.gender,
                        blood_group: form.blood_group,
                        address: form.address,
                        medical_notes: form.medical_notes,
                        emergency_contact: form.emergency_contact,
                        emergency_phone: form.emergency_phone,
                    })
                    .eq('id', editingStudent.id)
                if (studentError) throw studentError

                toast.success('Student updated successfully!')
            } else {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: crypto.randomUUID(),
                        full_name: form.full_name,
                        phone: form.phone,
                        role: 'student',
                    })
                    .select()
                    .single()

                if (profileError) throw profileError

                const { error: studentError } = await supabase.from('students').insert({
                    profile_id: profileData.id,
                    class_id: form.class_id || null,
                    roll_number: form.roll_number,
                    date_of_birth: form.date_of_birth || null,
                    gender: form.gender,
                    blood_group: form.blood_group,
                    address: form.address,
                    medical_notes: form.medical_notes,
                    emergency_contact: form.emergency_contact,
                    emergency_phone: form.emergency_phone,
                    status: 'active',
                })
                if (studentError) throw studentError

                toast.success('Student added successfully!')
            }
            onSuccess()
        } catch (err) {
            toast.error(err.message || 'Something went wrong')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col my-auto">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 bg-white/50 backdrop-blur-md z-10 shrink-0 rounded-t-3xl sticky top-0">
                    <h2 className="text-2xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-violet-600" />
                        {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-8 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Personal & Account */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-8 h-px bg-violet-200"></span> Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full Name *</label>
                                        <input name="full_name" value={form.full_name} onChange={handleChange} className="input-glass" placeholder="e.g. John Doe" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Date of Birth</label>
                                            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="input-glass" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Gender</label>
                                            <select name="gender" value={form.gender} onChange={handleChange} className="input-glass">
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Phone</label>
                                            <input name="phone" value={form.phone} onChange={handleChange} className="input-glass" placeholder="+91 9876543210" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Blood Group</label>
                                            <select name="blood_group" value={form.blood_group} onChange={handleChange} className="input-glass">
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {!editingStudent && (
                                <section>
                                    <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="w-8 h-px bg-violet-200"></span> Account Credentials
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email *</label>
                                            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-glass" placeholder="student@school.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password *</label>
                                            <input name="password" type="password" value={form.password} onChange={handleChange} className="input-glass" placeholder="Min 6 characters" />
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column: Academic & Emergency */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-8 h-px bg-violet-200"></span> Academic Profile
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Assign Class</label>
                                        <select name="class_id" value={form.class_id} onChange={handleChange} className="input-glass">
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Roll Number</label>
                                        <input name="roll_number" value={form.roll_number} onChange={handleChange} className="input-glass" placeholder="e.g. 001" />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-8 h-px bg-violet-200"></span> Contact & Emergency
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Residential Address</label>
                                        <textarea name="address" value={form.address} onChange={handleChange} className="input-glass resize-none" rows={2} placeholder="Full address" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Emergency Contact</label>
                                            <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange} className="input-glass" placeholder="Name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Emergency Phone</label>
                                            <input name="emergency_phone" value={form.emergency_phone} onChange={handleChange} className="input-glass" placeholder="Phone" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Medical Notes</label>
                                        <textarea name="medical_notes" value={form.medical_notes} onChange={handleChange} className="input-glass resize-none" rows={2} placeholder="Allergies, conditions, etc..." />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 p-6 border-t border-zinc-200/50 bg-zinc-50/80 backdrop-blur-md shrink-0 rounded-b-3xl">
                    <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl text-zinc-600 font-semibold hover:bg-white transition-colors text-sm border border-transparent hover:border-zinc-200 shadow-sm">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary py-3">
                        {loading ? 'Saving...' : editingStudent ? 'Save Changes' : 'Register Student'}
                    </button>
                </div>
            </div>
        </div>
    )
}