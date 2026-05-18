import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'

export default function Fees() {
    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])
    const [feeStructures, setFeeStructures] = useState([])
    const [payments, setPayments] = useState([])
    const [selectedClass, setSelectedClass] = useState('')
    const [viewMode, setViewMode] = useState('payments') // 'payments' | 'structure'
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showStructureModal, setShowStructureModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)

    const [paymentForm, setPaymentForm] = useState({
        student_id: '',
        fee_structure_id: '',
        amount_paid: '',
        payment_method: 'cash',
        receipt_number: '',
        status: 'paid',
    })

    const [structureForm, setStructureForm] = useState({
        class_id: '',
        fee_type: '',
        amount: '',
        academic_year: '2025-2026',
        due_date: '',
    })

    useEffect(() => {
        fetchClasses()
        fetchPayments()
        fetchFeeStructures()
    }, [])

    useEffect(() => {
        if (selectedClass) fetchStudents()
    }, [selectedClass])

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

    const fetchFeeStructures = async () => {
        const { data } = await supabase
            .from('fee_structure')
            .select('*, classes(name, section)')
            .order('created_at', { ascending: false })
        setFeeStructures(data || [])
    }

    const fetchPayments = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('fee_payments')
            .select(`
        *,
        students(profiles(full_name), roll_number, classes(name, section)),
        fee_structure(fee_type, amount)
      `)
            .order('created_at', { ascending: false })
            .limit(50)
        setPayments(data || [])
        setLoading(false)
    }

    const handleAddPayment = async () => {
        if (!paymentForm.student_id || !paymentForm.amount_paid) {
            toast.error('Student and amount are required')
            return
        }
        setSaving(true)
        try {
            const receipt = paymentForm.receipt_number || `RCP-${Date.now()}`
            const { error } = await supabase.from('fee_payments').insert({
                student_id: paymentForm.student_id,
                fee_structure_id: paymentForm.fee_structure_id || null,
                amount_paid: Number(paymentForm.amount_paid),
                payment_method: paymentForm.payment_method,
                receipt_number: receipt,
                status: paymentForm.status,
                payment_date: new Date().toISOString().split('T')[0],
            })
            if (error) throw error

            // Add to timeline
            await supabase.from('student_timeline').insert({
                student_id: paymentForm.student_id,
                event_type: 'Fee Payment',
                description: `₹${paymentForm.amount_paid} paid via ${paymentForm.payment_method}. Receipt: ${receipt}`,
            })

            toast.success('Payment recorded successfully!')
            setShowPaymentModal(false)
            fetchPayments()
            setPaymentForm({
                student_id: '', fee_structure_id: '', amount_paid: '',
                payment_method: 'cash', receipt_number: '', status: 'paid',
            })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const handleAddStructure = async () => {
        if (!structureForm.class_id || !structureForm.fee_type || !structureForm.amount) {
            toast.error('Class, fee type and amount are required')
            return
        }
        setSaving(true)
        try {
            const { error } = await supabase.from('fee_structure').insert({
                class_id: structureForm.class_id,
                fee_type: structureForm.fee_type,
                amount: Number(structureForm.amount),
                academic_year: structureForm.academic_year,
                due_date: structureForm.due_date || null,
            })
            if (error) throw error
            toast.success('Fee structure added!')
            setShowStructureModal(false)
            fetchFeeStructures()
            setStructureForm({ class_id: '', fee_type: '', amount: '', academic_year: '2025-2026', due_date: '' })
        } catch (err) {
            toast.error(err.message)
        }
        setSaving(false)
    }

    const statusConfig = {
        paid: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        overdue: 'bg-red-100 text-red-700',
        partial: 'bg-blue-100 text-blue-700',
    }

    // Summary stats
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount_paid), 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount_paid), 0)
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount_paid), 0)

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Fee Management</h1>
                        <p className="text-gray-400 text-sm mt-1">Track and manage student fee payments</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowStructureModal(true)}
                            className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            ⚙️ Fee Structure
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
                        >
                            ➕ Record Payment
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                            <span className="text-xl">✅</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">₹{totalCollected.toLocaleString()}</p>
                        <p className="text-sm text-gray-400 mt-1">Total Collected</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
                            <span className="text-xl">⏳</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">₹{totalPending.toLocaleString()}</p>
                        <p className="text-sm text-gray-400 mt-1">Pending</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">₹{totalOverdue.toLocaleString()}</p>
                        <p className="text-sm text-gray-400 mt-1">Overdue</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('payments')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'payments' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                        💳 Payments
                    </button>
                    <button
                        onClick={() => setViewMode('structure')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'structure' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                    >
                        ⚙️ Fee Structure
                    </button>
                </div>

                {/* Payments Tab */}
                {viewMode === 'payments' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Recent Payments</h2>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">💰</p>
                                <p className="text-gray-500">No payments recorded yet</p>
                                <p className="text-gray-400 text-sm mt-1">Click "Record Payment" to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Fee Type</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Method</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Receipt</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment, i) => (
                                            <tr key={payment.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-gray-800">{payment.students?.profiles?.full_name}</p>
                                                    <p className="text-xs text-gray-400">{payment.students?.classes?.name} {payment.students?.classes?.section}</p>
                                                </td>
                                                <td className="px-5 py-3 text-gray-500">{payment.fee_structure?.fee_type || 'General'}</td>
                                                <td className="px-5 py-3 font-semibold text-gray-800">₹{Number(payment.amount_paid).toLocaleString()}</td>
                                                <td className="px-5 py-3 text-gray-500 capitalize">{payment.payment_method}</td>
                                                <td className="px-5 py-3 text-gray-400 text-xs">{payment.receipt_number}</td>
                                                <td className="px-5 py-3 text-gray-400">{payment.payment_date}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[payment.status]}`}>
                                                        {payment.status}
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

                {/* Fee Structure Tab */}
                {viewMode === 'structure' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Fee Structures</h2>
                        </div>
                        {feeStructures.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-4xl mb-3">⚙️</p>
                                <p className="text-gray-500">No fee structures defined</p>
                                <p className="text-gray-400 text-sm mt-1">Click "Fee Structure" to add one</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Class</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Fee Type</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Due Date</th>
                                            <th className="text-left px-5 py-3 text-gray-500 font-medium">Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeStructures.map((fs, i) => (
                                            <tr key={fs.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-5 py-3 font-medium text-gray-800">{fs.classes?.name} {fs.classes?.section}</td>
                                                <td className="px-5 py-3 text-gray-600">{fs.fee_type}</td>
                                                <td className="px-5 py-3 font-semibold text-gray-800">₹{Number(fs.amount).toLocaleString()}</td>
                                                <td className="px-5 py-3 text-gray-400">{fs.due_date || 'N/A'}</td>
                                                <td className="px-5 py-3 text-gray-400">{fs.academic_year}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
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
                                    value={paymentForm.student_id}
                                    onChange={e => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                                <select
                                    value={paymentForm.fee_structure_id}
                                    onChange={e => {
                                        const selected = feeStructures.find(f => f.id === e.target.value)
                                        setPaymentForm({
                                            ...paymentForm,
                                            fee_structure_id: e.target.value,
                                            amount_paid: selected ? selected.amount : paymentForm.amount_paid
                                        })
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select fee type (optional)...</option>
                                    {feeStructures.map(f => (
                                        <option key={f.id} value={f.id}>{f.fee_type} - ₹{f.amount}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹) *</label>
                                <input
                                    type="number"
                                    value={paymentForm.amount_paid}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentForm.payment_method}
                                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                                <input
                                    type="text"
                                    value={paymentForm.receipt_number}
                                    onChange={e => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Auto-generated if left empty"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={paymentForm.status}
                                    onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddPayment} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Saving...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fee Structure Modal */}
            {showStructureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Fee Structure</h2>
                            <button onClick={() => setShowStructureModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                <select
                                    value={structureForm.class_id}
                                    onChange={e => setStructureForm({ ...structureForm, class_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                                <input
                                    type="text"
                                    value={structureForm.fee_type}
                                    onChange={e => setStructureForm({ ...structureForm, fee_type: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Tuition Fee / Exam Fee / Transport..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                <input
                                    type="number"
                                    value={structureForm.amount}
                                    onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={structureForm.due_date}
                                    onChange={e => setStructureForm({ ...structureForm, due_date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                <input
                                    type="text"
                                    value={structureForm.academic_year}
                                    onChange={e => setStructureForm({ ...structureForm, academic_year: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="2025-2026"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowStructureModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleAddStructure} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition text-sm">
                                {saving ? 'Saving...' : 'Add Structure'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}