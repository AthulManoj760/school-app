import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Grades() {
    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])
    const [subjects, setSubjects] = useState([])
    const [grades, setGrades] = useState([])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedStudent, setSelectedStudent] = useState('')
    const [viewMode, setViewMode] = useState('add') // 'add' or 'report'
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({
        student_id: '',
        subject_id: '',
        exam_type: 'unit_test',
        marks_obtained: '',
        total_marks: '100',
        academic_year: '2025-2026',
    })

    useEffect(() => { fetchClasses() }, [])

    useEffect(() => {
        if (selectedClass) {
            fetchStudents()
            fetchSubjects()
        }
    }, [selectedClass])

    useEffect(() => {
        if (selectedStudent) fetchGrades()
    }, [selectedStudent])

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*')
        setClasses(data || [])
    }

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('*, profiles(full_name)')
            .eq('class_id', selectedClass)
            .eq('status', 'active')
        setStudents(data || [])
    }

    const fetchSubjects = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_id', selectedClass)
        setSubjects(data || [])
    }

    const fetchGrades = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('grades')
            .select('*, subjects(name)')
            .eq('student_id', selectedStudent)
            .order('created_at', { ascending: false })
        setGrades(data || [])
        setLoading(false)
    }

    const getGradeLetter = (obtained, total) => {
        const percent = (obtained / total) * 100
        if (percent >= 90) return 'A+'
        if (percent >= 80) return 'A'
        if (percent >= 70) return 'B+'
        if (percent >= 60) return 'B'
        if (percent >= 50) return 'C'
        if (percent >= 40) return 'D'
        return 'F'
    }

    const getGradeColor = (grade) => {
        if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-700'
        if (grade === 'B+' || grade === 'B') return 'bg-blue-100 text-blue-700'
        if (grade === 'C') return 'bg-yellow-100 text-yellow-700'
        if (grade === 'D') return 'bg-orange-100 text-orange-700'
        return 'bg-red-100 text-red-700'
    }

    const handleSubmit = async () => {
        if (!form.student_id || !form.marks_obtained || !form.total_marks) {
            toast.error('Please fill all required fields')
            return
        }
        setSaving(true)
        try {
            const grade = getGradeLetter(Number(form.marks_obtained), Number(form.total_marks))
            const { error } = await supabase.from('grades').insert({
                student_id: form.student_id,
                subject_id: form.subject_id || null,
                exam_type: form.exam_type,
                marks_obtained: Number(form.marks_obtained),
                total_marks: Number(form.total_marks),
                grade,
                academic_year: form.academic_year,
            })
            if (error) throw error

            // Add to timeline
            await supabase.from('student_timeline').insert({
                student_id: form.student_id,
                event_type: 'Grade Added',
                description: `${form.exam_type.replace('_', ' ')} - ${form.marks_obtained}/${form.total_marks} (${grade})`,
            })

            toast.success('Grade added successfully!')
            setShowModal(false)
            if (selectedStudent === form.student_id) fetchGrades()
            setForm({ ...form, marks_obtained: '', subject_id: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const selectedStudentData = students.find(s => s.id === selectedStudent)

    // Calculate report card stats
    const totalMarks = grades.reduce((sum, g) => sum + Number(g.marks_obtained), 0)
    const totalPossible = grades.reduce((sum, g) => sum + Number(g.total_marks), 0)
    const overallPercent = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0
    const overallGrade = totalPossible > 0 ? getGradeLetter(totalMarks, totalPossible) : 'N/A'

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Grades</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage student grades and report cards</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
                    >
                        <span>➕</span> Add Grade
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                            <select
                                value={selectedClass}
                                onChange={e => { setSelectedClass(e.target.value); setSelectedStudent('') }}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Choose a class...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <select
                                value={selectedStudent}
                                onChange={e => setSelectedStudent(e.target.value)}
                                disabled={!selectedClass}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
                            >
                                <option value="">Choose a student...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedStudent && (
                    <>
                        {/* Student Summary Card */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                                        {selectedStudentData?.profiles?.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{selectedStudentData?.profiles?.full_name}</p>
                                        <p className="text-sm text-gray-400">Roll: {selectedStudentData?.roll_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">{grades.length}</p>
                                        <p className="text-xs text-gray-400">Exams</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">{overallPercent}%</p>
                                        <p className="text-xs text-gray-400">Overall</p>
                                    </div>
                                    <div>
                                        <span className={`text-2xl font-bold px-3 py-1 rounded-xl ${getGradeColor(overallGrade)}`}>
                                            {overallGrade}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">Grade</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-800">Grade Records</h2>
                            </div>
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : grades.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-4xl mb-3">📝</p>
                                    <p className="text-gray-500">No grades recorded yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Click "Add Grade" to get started</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Exam Type</th>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Marks</th>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Percentage</th>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Grade</th>
                                                <th className="text-left px-5 py-3 text-gray-500 font-medium">Year</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.map((grade, i) => {
                                                const percent = ((grade.marks_obtained / grade.total_marks) * 100).toFixed(1)
                                                return (
                                                    <tr key={grade.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="px-5 py-3 text-gray-800 font-medium">
                                                            {grade.subjects?.name || 'General'}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-500 capitalize">
                                                            {grade.exam_type?.replace('_', ' ')}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-800">
                                                            {grade.marks_obtained}/{grade.total_marks}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-600">{percent}%</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.grade)}`}>
                                                                {grade.grade}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-400">{grade.academic_year}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {!selectedStudent && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-4xl mb-3">📝</p>
                        <p className="text-gray-500 font-medium">Select a class and student to view grades</p>
                    </div>
                )}
            </div>

            {/* Add Grade Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Grade</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select
                                    value={form.class_id}
                                    onChange={e => {
                                        setForm({ ...form, class_id: e.target.value, student_id: '' })
                                        setSelectedClass(e.target.value)
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                                <select
                                    value={form.student_id}
                                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
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
                                    <option value="">Select subject (optional)...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                                <select
                                    value={form.exam_type}
                                    onChange={e => setForm({ ...form, exam_type: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="unit_test">Unit Test</option>
                                    <option value="midterm">Midterm</option>
                                    <option value="final">Final Exam</option>
                                    <option value="assignment">Assignment</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained *</label>
                                    <input
                                        type="number"
                                        value={form.marks_obtained}
                                        onChange={e => setForm({ ...form, marks_obtained: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="85"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                                    <input
                                        type="number"
                                        value={form.total_marks}
                                        onChange={e => setForm({ ...form, total_marks: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="100"
                                    />
                                </div>
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

                            {form.marks_obtained && form.total_marks && (
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <span className="text-sm text-blue-600 font-medium">
                                        Grade Preview: {' '}
                                        <span className={`px-2 py-0.5 rounded-lg text-sm font-bold ${getGradeColor(getGradeLetter(Number(form.marks_obtained), Number(form.total_marks)))}`}>
                                            {getGradeLetter(Number(form.marks_obtained), Number(form.total_marks))}
                                        </span>
                                        {' '} ({((form.marks_obtained / form.total_marks) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}