import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Students() {
    const [students, setStudents] = useState([])
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [showModal, setShowModal] = useState(false)
    const navigate = useNavigate()

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
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                        <p className="text-gray-400 text-sm mt-1">{students.length} total students</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <span>➕</span> Add Student
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <p className="text-5xl mb-4">👨‍🎓</p>
                        <p className="text-gray-500 font-medium">No students found</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first student to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(student => (
                            <div
                                key={student.id}
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                                        {student.profiles?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">
                                            {student.profiles?.full_name || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Roll: {student.roll_number || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${student.status === 'active'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        {student.status}
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-400">
                                    <span>🏫 {student.classes?.name} {student.classes?.section || ''}</span>
                                    <span>📞 {student.profiles?.phone || 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <AddStudentModal
                    classes={classes}
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

function AddStudentModal({ classes, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        roll_number: '',
        class_id: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        medical_notes: '',
        emergency_contact: '',
        emergency_phone: '',
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
            // 1. Insert directly into profiles table
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

            // 2. Create student record
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
            onSuccess()
        } catch (err) {
            toast.error(err.message || 'Something went wrong')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Add New Student</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">

                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Personal Info</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input name="full_name" value={form.full_name} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input name="phone" value={form.phone} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="+91 9876543210" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="student@school.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Min 6 characters" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select name="gender" value={form.gender} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                            <select name="blood_group" value={form.blood_group} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                            <input name="roll_number" value={form.roll_number} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="001" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select name="class_id" value={form.class_id} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                            <option value="">Select Class</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea name="address" value={form.address} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2} placeholder="Full address" />
                    </div>

                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider pt-2">Emergency & Medical</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                            <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Parent/Guardian name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                            <input name="emergency_phone" value={form.emergency_phone} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="+91 9876543210" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
                        <textarea name="medical_notes" value={form.medical_notes} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2} placeholder="Any allergies, conditions or notes..." />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                        {loading ? 'Adding...' : 'Add Student'}
                    </button>
                </div>
            </div>
        </div>
    )
}