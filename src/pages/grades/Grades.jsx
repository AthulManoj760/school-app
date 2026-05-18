import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { ClipboardSignature, Plus, Printer, BookOpen, X, Award } from 'lucide-react'

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
        if (grade === 'A+' || grade === 'A') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        if (grade === 'B+' || grade === 'B') return 'bg-sky-50 text-sky-700 border-sky-200'
        if (grade === 'C') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
        if (grade === 'D') return 'bg-orange-50 text-orange-700 border-orange-200'
        return 'bg-rose-50 text-rose-700 border-rose-200'
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
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Grades</h1>
                        <p className="text-zinc-500 mt-1">Manage student grades and report cards</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        <Award className="w-5 h-5" />
                        <span>Add Grade</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-panel p-5 print:hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Select Class</label>
                            <select
                                value={selectedClass}
                                onChange={e => { setSelectedClass(e.target.value); setSelectedStudent('') }}
                                className="input-glass"
                            >
                                <option value="">Choose a class...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Select Student</label>
                            <select
                                value={selectedStudent}
                                onChange={e => setSelectedStudent(e.target.value)}
                                disabled={!selectedClass}
                                className="input-glass disabled:opacity-50"
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
                        {/* Print Header */}
                        <div className="hidden print:block text-center mb-8 border-b-2 border-zinc-800 pb-6 mt-4">
                            <h1 className="text-4xl font-bold text-zinc-900 mb-2">School Report Card</h1>
                            <p className="text-xl text-zinc-600">Academic Year: {grades[0]?.academic_year || '2025-2026'}</p>
                        </div>

                        {/* Student Summary Card */}
                        <div className="glass-panel p-6 print:shadow-none print:border-2 print:border-zinc-200 print:mb-8 print:bg-white">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-xl font-bold text-violet-600 shadow-inner shrink-0">
                                        {selectedStudentData?.profiles?.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-zinc-800 tracking-tight">{selectedStudentData?.profiles?.full_name}</p>
                                        <p className="text-sm text-zinc-500">Roll: {selectedStudentData?.roll_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-center">
                                    <div className="flex gap-6 divide-x divide-white/50 print:divide-zinc-200">
                                        <div className="pr-6">
                                            <p className="text-3xl font-bold text-zinc-800 tracking-tight">{grades.length}</p>
                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Exams</p>
                                        </div>
                                        <div className="pl-6 pr-6">
                                            <p className="text-3xl font-bold text-zinc-800 tracking-tight">{overallPercent}%</p>
                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Overall</p>
                                        </div>
                                        <div className="pl-6">
                                            <span className={`text-2xl font-bold px-3 py-1 rounded-xl border ${getGradeColor(overallGrade)} print:border print:border-zinc-300`}>
                                                {overallGrade}
                                            </span>
                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-2">Grade</p>
                                        </div>
                                    </div>
                                    {/* Print Button */}
                                    <button
                                        onClick={() => window.print()}
                                        className="print:hidden ml-4 btn-glass px-4 py-2"
                                    >
                                        <Printer className="w-4 h-4" /> Print
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="glass-panel overflow-hidden print:shadow-none print:border-2 print:border-zinc-200 print:bg-white">
                            <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-sm print:bg-zinc-50">
                                <h2 className="font-bold text-zinc-800 tracking-tight">Grade Records</h2>
                            </div>
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : grades.length === 0 ? (
                                <div className="text-center py-16">
                                    <BookOpen className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                    <p className="text-zinc-500 font-medium">No grades recorded yet</p>
                                    <p className="text-zinc-400 text-sm mt-1">Click "Add Grade" to get started</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white/40 border-b border-white print:bg-zinc-100">
                                            <tr>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Subject</th>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Exam Type</th>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Marks</th>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Percentage</th>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Grade</th>
                                                <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Year</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/50 print:divide-zinc-200">
                                            {grades.map((grade) => {
                                                const percent = ((grade.marks_obtained / grade.total_marks) * 100).toFixed(1)
                                                return (
                                                    <tr key={grade.id} className="hover:bg-white/40 transition-colors print:hover:bg-transparent">
                                                        <td className="px-5 py-4 text-zinc-800 font-medium">
                                                            {grade.subjects?.name || 'General'}
                                                        </td>
                                                        <td className="px-5 py-4 text-zinc-500 capitalize">
                                                            {grade.exam_type?.replace('_', ' ')}
                                                        </td>
                                                        <td className="px-5 py-4 text-zinc-800 font-medium">
                                                            {grade.marks_obtained}/{grade.total_marks}
                                                        </td>
                                                        <td className="px-5 py-4 text-zinc-600">{percent}%</td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getGradeColor(grade.grade)}`}>
                                                                {grade.grade}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-zinc-400">{grade.academic_year}</td>
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
                    <div className="text-center py-16 glass-panel print:hidden">
                        <ClipboardSignature className="w-16 h-16 mx-auto text-violet-200 mb-4" />
                        <p className="text-zinc-500 font-medium">Select a class and student to view grades</p>
                    </div>
                )}
            </div>

            {/* Add Grade Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight">Add Grade</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class</label>
                                <select
                                    value={form.class_id}
                                    onChange={e => {
                                        setForm({ ...form, class_id: e.target.value, student_id: '' })
                                        setSelectedClass(e.target.value)
                                    }}
                                    className="input-glass"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Student *</label>
                                <select
                                    value={form.student_id}
                                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
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
                                    <option value="">Select subject (optional)...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Exam Type</label>
                                <select
                                    value={form.exam_type}
                                    onChange={e => setForm({ ...form, exam_type: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="unit_test">Unit Test</option>
                                    <option value="midterm">Midterm</option>
                                    <option value="final">Final Exam</option>
                                    <option value="assignment">Assignment</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Marks Obtained *</label>
                                    <input
                                        type="number"
                                        value={form.marks_obtained}
                                        onChange={e => setForm({ ...form, marks_obtained: e.target.value })}
                                        className="input-glass"
                                        placeholder="85"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Total Marks *</label>
                                    <input
                                        type="number"
                                        value={form.total_marks}
                                        onChange={e => setForm({ ...form, total_marks: e.target.value })}
                                        className="input-glass"
                                        placeholder="100"
                                    />
                                </div>
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

                            {form.marks_obtained && form.total_marks && (
                                <div className="bg-violet-50/50 rounded-xl p-3 text-center border border-violet-100">
                                    <span className="text-sm text-violet-700 font-medium">
                                        Grade Preview: {' '}
                                        <span className={`px-2 py-0.5 rounded-lg text-sm font-bold border ${getGradeColor(getGradeLetter(Number(form.marks_obtained), Number(form.total_marks)))}`}>
                                            {getGradeLetter(Number(form.marks_obtained), Number(form.total_marks))}
                                        </span>
                                        {' '} ({((form.marks_obtained / form.total_marks) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}