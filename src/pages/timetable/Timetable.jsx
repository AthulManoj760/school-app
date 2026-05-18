import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Timetable() {
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [teachers, setTeachers] = useState([])
    const [timetable, setTimetable] = useState([])
    const [selectedClass, setSelectedClass] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showSubjectModal, setShowSubjectModal] = useState(false)

    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        day: 'Monday',
        start_time: '',
        end_time: '',
    })

    const [subjectForm, setSubjectForm] = useState({
        name: '',
        class_id: '',
        teacher_id: '',
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const dayColors = {
        Monday: 'bg-blue-50 border-blue-200',
        Tuesday: 'bg-green-50 border-green-200',
        Wednesday: 'bg-purple-50 border-purple-200',
        Thursday: 'bg-yellow-50 border-yellow-200',
        Friday: 'bg-orange-50 border-orange-200',
        Saturday: 'bg-pink-50 border-pink-200',
    }

    const dayHeaderColors = {
        Monday: 'bg-blue-500',
        Tuesday: 'bg-green-500',
        Wednesday: 'bg-purple-500',
        Thursday: 'bg-yellow-500',
        Friday: 'bg-orange-500',
        Saturday: 'bg-pink-500',
    }

    useEffect(() => {
        fetchClasses()
        fetchTeachers()
    }, [])

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable()
            fetchSubjects()
        }
    }, [selectedClass])

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*')
        setClasses(data || [])
    }

    const fetchTeachers = async () => {
        const { data } = await supabase
            .from('teachers')
            .select('*, profiles(full_name)')
        setTeachers(data || [])
    }

    const fetchSubjects = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('*, teachers(profiles(full_name))')
            .eq('class_id', selectedClass)
        setSubjects(data || [])
    }

    const fetchTimetable = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('timetable')
            .select('*, subjects(name), classes(name, section)')
            .eq('class_id', selectedClass)
            .order('start_time', { ascending: true })
        setTimetable(data || [])
        setLoading(false)
    }

    const handleAddSlot = async () => {
        if (!form.class_id || !form.day || !form.start_time || !form.end_time) {
            toast.error('Class, day, start time and end time are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('timetable').insert({
                class_id: form.class_id,
                subject_id: form.subject_id || null,
                day: form.day,
                start_time: form.start_time,
                end_time: form.end_time,
            })
            if (error) throw error
            toast.success('Timetable slot added!')
            setShowModal(false)
            fetchTimetable()
            setForm({ class_id: selectedClass, subject_id: '', day: 'Monday', start_time: '', end_time: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleAddSubject = async () => {
        if (!subjectForm.name || !subjectForm.class_id) {
            toast.error('Subject name and class are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('subjects').insert({
                name: subjectForm.name,
                class_id: subjectForm.class_id,
                teacher_id: subjectForm.teacher_id || null,
            })
            if (error) throw error
            toast.success('Subject added!')
            setShowSubjectModal(false)
            fetchSubjects()
            setSubjectForm({ name: '', class_id: '', teacher_id: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleDeleteSlot = async (id) => {
        const { error } = await supabase.from('timetable').delete().eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Slot removed')
            fetchTimetable()
        }
    }

    // Group timetable by day
    const timetableByDay = days.reduce((acc, day) => {
        acc[day] = timetable.filter(t => t.day === day).sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
        )
        return acc
    }, {})

    const formatTime = (time) => {
        if (!time) return ''
        const [hour, min] = time.split(':')
        const h = parseInt(hour)
        return `${h > 12 ? h - 12 : h}:${min} ${h >= 12 ? 'PM' : 'AM'}`
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage class schedules</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setShowSubjectModal(true)}
                            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            📚 Add Subject
                        </button>
                        <button
                            onClick={() => {
                                setForm({ ...form, class_id: selectedClass })
                                setShowModal(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            ➕ Add Slot
                        </button>
                    </div>
                </div>

                {/* Class Selector */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="w-full sm:w-72 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Choose a class...</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                        ))}
                    </select>
                </div>

                {/* Subjects List */}
                {selectedClass && subjects.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm">📚 Subjects in this class</h3>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(subject => (
                                <span key={subject.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium">
                                    {subject.name}
                                    {subject.teachers?.profiles?.full_name && (
                                        <span className="text-blue-400 ml-1">· {subject.teachers.profiles.full_name}</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timetable Grid */}
                {selectedClass && (
                    loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {days.map(day => (
                                <div key={day} className={`rounded-2xl border overflow-hidden ${dayColors[day]}`}>
                                    {/* Day Header */}
                                    <div className={`${dayHeaderColors[day]} px-4 py-3 flex items-center justify-between`}>
                                        <h3 className="font-semibold text-white text-sm">{day}</h3>
                                        <span className="text-white text-xs opacity-80">
                                            {timetableByDay[day].length} periods
                                        </span>
                                    </div>

                                    {/* Periods */}
                                    <div className="p-3 space-y-2">
                                        {timetableByDay[day].length === 0 ? (
                                            <p className="text-center text-gray-400 text-xs py-4">No periods added</p>
                                        ) : (
                                            timetableByDay[day].map(slot => (
                                                <div key={slot.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between group">
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">
                                                            {slot.subjects?.name || 'Free Period'}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="text-gray-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-lg"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        <button
                                            onClick={() => {
                                                setForm({ ...form, class_id: selectedClass, day })
                                                setShowModal(true)
                                            }}
                                            className="w-full py-2 border border-dashed border-gray-300 text-gray-400 rounded-xl text-xs hover:border-blue-400 hover:text-blue-500 transition"
                                        >
                                            + Add period
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {!selectedClass && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-4xl mb-3">🗓️</p>
                        <p className="text-gray-500 font-medium">Select a class to view timetable</p>
                    </div>
                )}
            </div>

            {/* Add Slot Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Timetable Slot</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                <select
                                    value={form.class_id}
                                    onChange={e => setForm({ ...form, class_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                                <select
                                    value={form.day}
                                    onChange={e => setForm({ ...form, day: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    {days.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    value={form.subject_id}
                                    onChange={e => setForm({ ...form, subject_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Free Period</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddSlot} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Adding...' : 'Add Slot'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subject Modal */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Subject</h2>
                            <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                                <input
                                    type="text"
                                    value={subjectForm.name}
                                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                <select
                                    value={subjectForm.class_id}
                                    onChange={e => setSubjectForm({ ...subjectForm, class_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                                <select
                                    value={subjectForm.teacher_id}
                                    onChange={e => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">No teacher assigned</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowSubjectModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddSubject} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Adding...' : 'Add Subject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}