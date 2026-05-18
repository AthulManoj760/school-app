import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { CalendarCheck, History, Save, CheckCircle2, UserX, Clock, Plane, Users, CheckSquare } from 'lucide-react'

export default function Attendance() {
    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])
    const [attendance, setAttendance] = useState({})
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [viewMode, setViewMode] = useState('mark') // 'mark' or 'history'
    const [history, setHistory] = useState([])

    useEffect(() => { fetchClasses() }, [])

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchStudents()
            fetchExistingAttendance()
        }
    }, [selectedClass, selectedDate])

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*')
        setClasses(data || [])
    }

    const fetchStudents = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('students')
            .select('*, profiles(full_name)')
            .eq('class_id', selectedClass)
            .eq('status', 'active')
        setStudents(data || [])

        // Default all to present
        const defaults = {}
        data?.forEach(s => { defaults[s.id] = 'present' })
        setAttendance(prev => ({ ...defaults, ...prev }))
        setLoading(false)
    }

    const fetchExistingAttendance = async () => {
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', selectedClass)
            .eq('date', selectedDate)

        if (data && data.length > 0) {
            const existing = {}
            data.forEach(r => { existing[r.student_id] = r.status })
            setAttendance(existing)
        }
    }

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('attendance')
            .select('*, students(profiles(full_name)), classes(name, section)')
            .order('date', { ascending: false })
            .limit(50)
        setHistory(data || [])
    }

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const markAll = (status) => {
        const all = {}
        students.forEach(s => { all[s.id] = status })
        setAttendance(all)
    }

    const handleSave = async () => {
        if (!selectedClass || !selectedDate) {
            toast.error('Please select class and date')
            return
        }
        setSaving(true)
        try {
            // Delete existing attendance for this class+date
            await supabase
                .from('attendance')
                .delete()
                .eq('class_id', selectedClass)
                .eq('date', selectedDate)

            // Insert new attendance
            const records = students.map(s => ({
                student_id: s.id,
                class_id: selectedClass,
                date: selectedDate,
                status: attendance[s.id] || 'present',
            }))

            const { error } = await supabase.from('attendance').insert(records)
            if (error) throw error

            // Add to timeline for absent students
            const absentStudents = students.filter(s => attendance[s.id] === 'absent')
            for (const s of absentStudents) {
                await supabase.from('student_timeline').insert({
                    student_id: s.id,
                    event_type: 'Absence Recorded',
                    description: `Marked absent on ${selectedDate}`,
                })
            }

            toast.success('Attendance saved successfully!')
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const statusConfig = {
        present: { label: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
        absent: { label: 'Absent', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: UserX },
        late: { label: 'Late', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Clock },
        leave: { label: 'Leave', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', icon: Plane },
    }

    const summary = {
        present: students.filter(s => attendance[s.id] === 'present').length,
        absent: students.filter(s => attendance[s.id] === 'absent').length,
        late: students.filter(s => attendance[s.id] === 'late').length,
        leave: students.filter(s => attendance[s.id] === 'leave').length,
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Attendance</h1>
                        <p className="text-zinc-500 mt-1">Mark and track student attendance</p>
                    </div>
                    <div className="flex gap-2 glass-panel p-1 border-white/50">
                        <button
                            onClick={() => { setViewMode('mark') }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'mark' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <CheckSquare className="w-4 h-4" /> Mark
                        </button>
                        <button
                            onClick={() => { setViewMode('history'); fetchHistory() }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'history' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <History className="w-4 h-4" /> History
                        </button>
                    </div>
                </div>

                {viewMode === 'mark' && (
                    <>
                        {/* Filters */}
                        <div className="glass-panel p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Select Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={e => setSelectedClass(e.target.value)}
                                        className="input-glass"
                                    >
                                        <option value="">Choose a class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="input-glass"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedClass && students.length > 0 && (
                            <>
                                {/* Summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {Object.entries(summary).map(([status, count]) => (
                                        <div key={status} className="glass-panel p-4 text-center hover:-translate-y-1 transition-transform">
                                            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-inner ${statusConfig[status].color}`}>
                                                {status === 'present' && <CheckCircle2 className="w-5 h-5" />}
                                                {status === 'absent' && <UserX className="w-5 h-5" />}
                                                {status === 'late' && <Clock className="w-5 h-5" />}
                                                {status === 'leave' && <Plane className="w-5 h-5" />}
                                            </div>
                                            <p className="text-3xl font-bold text-zinc-800 tracking-tight">{count}</p>
                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">{status}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Mark All Buttons */}
                                <div className="flex gap-2 flex-wrap items-center bg-white/40 p-2 rounded-2xl border border-white">
                                    <span className="text-sm font-medium text-zinc-500 px-2">Mark all:</span>
                                    {Object.keys(statusConfig).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => markAll(status)}
                                            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors shadow-sm ${statusConfig[status].color} hover:brightness-95`}
                                        >
                                            {statusConfig[status].label}
                                        </button>
                                    ))}
                                </div>

                                {/* Student List */}
                                <div className="glass-panel overflow-hidden">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/50">
                                            {students.map((student) => (
                                                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/40 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center font-bold text-violet-600 shrink-0">
                                                            {student.profiles?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-zinc-800 text-sm">{student.profiles?.full_name}</p>
                                                            <p className="text-xs text-zinc-500">Roll: {student.roll_number || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status Buttons */}
                                                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                                        {Object.keys(statusConfig).map(status => {
                                                            const isSelected = attendance[student.id] === status;
                                                            const Icon = statusConfig[status].icon;
                                                            return (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleStatusChange(student.id, status)}
                                                                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${isSelected
                                                                            ? `${statusConfig[status].color} shadow-sm ring-1 ring-inset ${statusConfig[status].color.split(' ')[2]}`
                                                                            : 'bg-white/50 text-zinc-500 border-white hover:bg-white/80'
                                                                        }`}
                                                                >
                                                                    <Icon className="w-3.5 h-3.5" />
                                                                    <span className={!isSelected ? 'hidden sm:inline' : 'inline'}>{statusConfig[status].label}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary w-full py-4 text-base"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : 'Save Attendance'}
                                </button>
                            </>
                        )}

                        {selectedClass && students.length === 0 && !loading && (
                            <div className="text-center py-16 glass-panel">
                                <Users className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-500 font-medium">No students found in this class</p>
                            </div>
                        )}

                        {!selectedClass && (
                            <div className="text-center py-16 glass-panel">
                                <CalendarCheck className="w-16 h-16 mx-auto text-violet-200 mb-4" />
                                <p className="text-zinc-500 font-medium">Select a class to mark attendance</p>
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'history' && (
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-sm">
                            <h2 className="font-bold text-zinc-800 tracking-tight">Recent Attendance Records</h2>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-center py-16">
                                <History className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-400">No attendance records yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/40 border-b border-white">
                                        <tr>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Student</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Class</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Date</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/50">
                                        {history.map((record) => (
                                            <tr key={record.id} className="hover:bg-white/40 transition-colors">
                                                <td className="px-5 py-4 text-zinc-800 font-medium">
                                                    {record.students?.profiles?.full_name || 'Unknown'}
                                                </td>
                                                <td className="px-5 py-4 text-zinc-500">
                                                    {record.classes?.name} {record.classes?.section}
                                                </td>
                                                <td className="px-5 py-4 text-zinc-500">{record.date}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[record.status]?.color}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}