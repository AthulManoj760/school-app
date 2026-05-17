import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function StudentProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [student, setStudent] = useState(null)
    const [timeline, setTimeline] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchStudent()
        fetchTimeline()
    }, [id])

    const fetchStudent = async () => {
        const { data, error } = await supabase
            .from('students')
            .select(`*, profiles(*), classes(name, section)`)
            .eq('id', id)
            .single()
        if (error) toast.error('Student not found')
        else setStudent(data)
        setLoading(false)
    }

    const fetchTimeline = async () => {
        const { data } = await supabase
            .from('student_timeline')
            .select('*')
            .eq('student_id', id)
            .order('created_at', { ascending: false })
        setTimeline(data || [])
    }

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </Layout>
    )

    if (!student) return (
        <Layout>
            <div className="text-center py-20">
                <p className="text-gray-500">Student not found</p>
                <button onClick={() => navigate('/students')} className="mt-4 text-blue-600">← Back to Students</button>
            </div>
        </Layout>
    )

    const tabs = ['overview', 'attendance', 'grades', 'fees', 'activities', 'timeline']

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Back Button */}
                <button onClick={() => navigate('/students')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition">
                    ← Back to Students
                </button>

                {/* Profile Header */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-blue-600">
                            {student.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-800">{student.profiles?.full_name}</h1>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${student.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>{student.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                <span>🏫 {student.classes?.name} {student.classes?.section || ''}</span>
                                <span>📋 Roll: {student.roll_number || 'N/A'}</span>
                                <span>📞 {student.profiles?.phone || 'N/A'}</span>
                                <span>🩸 {student.blood_group || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition ${activeTab === tab
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-4">Personal Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Date of Birth</span><span className="text-gray-700">{student.date_of_birth || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Gender</span><span className="text-gray-700 capitalize">{student.gender || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Blood Group</span><span className="text-gray-700">{student.blood_group || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Admission Date</span><span className="text-gray-700">{student.admission_date || 'N/A'}</span></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-4">Emergency & Medical</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Contact Person</span><span className="text-gray-700">{student.emergency_contact || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Emergency Phone</span><span className="text-gray-700">{student.emergency_phone || 'N/A'}</span></div>
                                <div className="flex flex-col gap-1"><span className="text-gray-400">Medical Notes</span><span className="text-gray-700">{student.medical_notes || 'None'}</span></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm md:col-span-2">
                            <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
                            <p className="text-sm text-gray-600">{student.address || 'No address provided'}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4">Activity Timeline</h3>
                        {timeline.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No activity recorded yet</p>
                        ) : (
                            <div className="space-y-4">
                                {timeline.map(event => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{event.event_type}</p>
                                            <p className="text-sm text-gray-500">{event.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(event.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {['attendance', 'grades', 'fees', 'activities'].includes(activeTab) && (
                    <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
                        <p className="text-4xl mb-3">🚧</p>
                        <p className="text-gray-500 font-medium capitalize">{activeTab} module coming soon</p>
                        <p className="text-gray-400 text-sm mt-1">We'll build this in the next steps</p>
                    </div>
                )}
            </div>
        </Layout>
    )
}