import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { CalendarClock, Plus, BookOpen, Clock, Trash2, X, CalendarDays } from 'lucide-react'

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
        Monday: 'bg-indigo-50/50 border-indigo-200/50',
        Tuesday: 'bg-emerald-50/50 border-emerald-200/50',
        Wednesday: 'bg-fuchsia-50/50 border-fuchsia-200/50',
        Thursday: 'bg-amber-50/50 border-amber-200/50',
        Friday: 'bg-sky-50/50 border-sky-200/50',
        Saturday: 'bg-rose-50/50 border-rose-200/50',
    }

    const dayHeaderColors = {
        Monday: 'bg-indigo-500',
        Tuesday: 'bg-emerald-500',
        Wednesday: 'bg-fuchsia-500',
        Thursday: 'bg-amber-500',
        Friday: 'bg-sky-500',
        Saturday: 'bg-rose-500',
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
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Timetable</h1>
                        <p className="text-zinc-500 mt-1">Manage class schedules</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setShowSubjectModal(true)}
                            className="btn-glass px-4 py-2"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Add Subject</span>
                        </button>
                        <button
                            onClick={() => {
                                setForm({ ...form, class_id: selectedClass })
                                setShowModal(true)
                            }}
                            className="btn-primary"
                        >
                            <CalendarClock className="w-5 h-5" />
                            <span>Add Slot</span>
                        </button>
                    </div>
                </div>

                {/* Class Selector */}
                <div className="glass-panel p-5">
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Select Class</label>
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="input-glass max-w-sm"
                    >
                        <option value="">Choose a class...</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                        ))}
                    </select>
                </div>

                {/* Subjects List */}
                {selectedClass && subjects.length > 0 && (
                    <div className="glass-panel p-5">
                        <h3 className="font-semibold text-zinc-700 mb-4 text-sm flex items-center gap-2 tracking-wide uppercase">
                            <BookOpen className="w-4 h-4 text-violet-500" /> Subjects in this class
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(subject => (
                                <span key={subject.id} className="px-4 py-2 bg-white/50 border border-white text-zinc-800 rounded-xl text-xs font-semibold shadow-sm backdrop-blur-md flex items-center gap-2">
                                    {subject.name}
                                    {subject.teachers?.profiles?.full_name && (
                                        <span className="text-zinc-400 font-normal">· {subject.teachers.profiles.full_name}</span>
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
                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {days.map(day => (
                                <div key={day} className={`rounded-3xl border shadow-lg backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${dayColors[day]}`}>
                                    {/* Day Header */}
                                    <div className={`${dayHeaderColors[day]} px-5 py-4 flex items-center justify-between shadow-inner`}>
                                        <h3 className="font-bold text-white tracking-wide">{day}</h3>
                                        <span className="text-white/80 text-xs font-medium px-2 py-1 bg-black/10 rounded-full backdrop-blur-md">
                                            {timetableByDay[day].length} periods
                                        </span>
                                    </div>

                                    {/* Periods */}
                                    <div className="p-4 space-y-3">
                                        {timetableByDay[day].length === 0 ? (
                                            <p className="text-center text-zinc-400 text-sm py-8 font-medium">No periods added</p>
                                        ) : (
                                            timetableByDay[day].map(slot => (
                                                <div key={slot.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white flex items-center justify-between group hover:bg-white/90 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-zinc-800 tracking-tight">
                                                            {slot.subjects?.name || 'Free Period'}
                                                        </p>
                                                        <p className="text-xs font-medium text-zinc-500 mt-1 flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                            {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                        <button
                                            onClick={() => {
                                                setForm({ ...form, class_id: selectedClass, day })
                                                setShowModal(true)
                                            }}
                                            className="w-full py-3 mt-2 border-2 border-dashed border-zinc-200/50 text-zinc-400 rounded-2xl text-xs font-semibold hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" /> Add period
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {!selectedClass && (
                    <div className="text-center py-16 glass-panel">
                        <CalendarClock className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium">Select a class to view timetable</p>
                    </div>
                )}
            </div>

            {/* Add Slot Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <Clock className="w-5 h-5 text-violet-600" />
                                Add Timetable Slot
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class *</label>
                                <select
                                    value={form.class_id}
                                    onChange={e => setForm({ ...form, class_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Day *</label>
                                <select
                                    value={form.day}
                                    onChange={e => setForm({ ...form, day: e.target.value })}
                                    className="input-glass"
                                >
                                    {days.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subject</label>
                                <select
                                    value={form.subject_id}
                                    onChange={e => setForm({ ...form, subject_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Free Period</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Start Time *</label>
                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                                        className="input-glass"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">End Time *</label>
                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                                        className="input-glass"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-transparent rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddSlot} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Adding...' : 'Add Slot'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subject Modal */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-violet-600" />
                                Add Subject
                            </h2>
                            <button onClick={() => setShowSubjectModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subject Name *</label>
                                <input
                                    type="text"
                                    value={subjectForm.name}
                                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                    className="input-glass"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class *</label>
                                <select
                                    value={subjectForm.class_id}
                                    onChange={e => setSubjectForm({ ...subjectForm, class_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Assign Teacher</label>
                                <select
                                    value={subjectForm.teacher_id}
                                    onChange={e => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">No teacher assigned</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowSubjectModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddSubject} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Adding...' : 'Add Subject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}