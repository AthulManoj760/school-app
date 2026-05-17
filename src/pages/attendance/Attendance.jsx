import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

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
        present: { label: 'Present', color: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500' },
        absent: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
        late: { label: 'Late', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500' },
        leave: { label: 'Leave', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
    }

    const summary = {
        present: students.filter(s => attendance[s.id] === 'present').length,
        absent: students.filter(s => attendance[s.id] === 'absent').length,
        late: students.filter(s => attendance[s.id] === 'late').length,
        leave: students.filter(s => attendance[s.id] === 'leave').length,
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
                        <p className="text-gray-400 text-sm mt-1">Mark and track student attendance</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setViewMode('mark') }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'mark' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                        >
                            ✅ Mark
                        </button>
                        <button
                            onClick={() => { setViewMode('history'); fetchHistory() }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'history' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                        >
                            📋 History
                        </button>
                    </div>
                </div>

                {viewMode === 'mark' && (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={e => setSelectedClass(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">Choose a class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedClass && students.length > 0 && (
                            <>
                                {/* Summary */}
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {Object.entries(summary).map(([status, count]) => (
                                        <div key={status} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                                            <div className={`w-3 h-3 rounded-full ${statusConfig[status].dot} mx-auto mb-2`}></div>
                                            <p className="text-2xl font-bold text-gray-800">{count}</p>
                                            <p className="text-xs text-gray-400 capitalize">{status}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Mark All Buttons */}
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    <span className="text-sm text-gray-500 self-center">Mark all:</span>
                                    {Object.keys(statusConfig).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => markAll(status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${statusConfig[status].color}`}
                                        >
                                            {statusConfig[status].label}
                                        </button>
                                    ))}
                                </div>

                                {/* Student List */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        students.map((student, index) => (
                                            <div key={student.id} className={`flex items-center justify-between p-4 ${index !== students.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                                        {student.profiles?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{student.profiles?.full_name}</p>
                                                        <p className="text-xs text-gray-400">Roll: {student.roll_number || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                {/* Status Buttons */}
                                                <div className="flex gap-2">
                                                    {Object.keys(statusConfig).map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleStatusChange(student.id, status)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${attendance[student.id] === status
                                                                    ? statusConfig[status].color
                                                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {statusConfig[status].label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition"
                                >
                                    {saving ? 'Saving...' : '💾 Save Attendance'}
                                </button>
                            </>
                        )}

                        {selectedClass && students.length === 0 && !loading && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <p className="text-4xl mb-3">👨‍🎓</p>
                                <p className="text-gray-500">No students found in this class</p>
                            </div>
                        )}

                        {!selectedClass && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <p className="text-4xl mb-3">✅</p>
                                <p className="text-gray-500 font-medium">Select a class to mark attendance</p>
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'history' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Recent Attendance Records</h2>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-gray-400">No attendance records yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Class</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((record, i) => (
                                            <tr key={record.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-5 py-3 text-gray-800">
                                                    {record.students?.profiles?.full_name || 'Unknown'}
                                                </td>
                                                <td className="px-5 py-3 text-gray-500">
                                                    {record.classes?.name} {record.classes?.section}
                                                </td>
                                                <td className="px-5 py-3 text-gray-500">{record.date}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig[record.status]?.color}`}>
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