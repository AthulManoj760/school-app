import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../supabase'
import toast from 'react-hot-toast'
import { Plus, Settings, CreditCard, CheckCircle2, Clock, AlertTriangle, IndianRupee, Settings2, HandCoins, X } from 'lucide-react'

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
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        overdue: 'bg-rose-50 text-rose-700 border-rose-200',
        partial: 'bg-sky-50 text-sky-700 border-sky-200',
    }

    // Summary stats
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount_paid), 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount_paid), 0)
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount_paid), 0)

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">Fee Management</h1>
                        <p className="text-zinc-500 mt-1">Track and manage student fee payments</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowStructureModal(true)}
                            className="btn-glass px-4 py-2"
                        >
                            <Settings2 className="w-5 h-5" />
                            <span className="hidden sm:inline">Fee Structure</span>
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="btn-primary"
                        >
                            <CreditCard className="w-5 h-5" />
                            <span>Record Payment</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 hover:-translate-y-1 transition-transform">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Collected</p>
                                <p className="text-3xl font-bold text-zinc-800 tracking-tight">₹{totalCollected.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 hover:-translate-y-1 transition-transform">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
                                <p className="text-3xl font-bold text-zinc-800 tracking-tight">₹{totalPending.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 hover:-translate-y-1 transition-transform">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Overdue</p>
                                <p className="text-3xl font-bold text-zinc-800 tracking-tight">₹{totalOverdue.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 glass-panel p-1 w-fit border-white/50">
                    <button
                        onClick={() => setViewMode('payments')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'payments' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <CreditCard className="w-4 h-4" /> Payments
                    </button>
                    <button
                        onClick={() => setViewMode('structure')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${viewMode === 'structure' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <Settings className="w-4 h-4" /> Fee Structure
                    </button>
                </div>

                {/* Payments Tab */}
                {viewMode === 'payments' && (
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-sm">
                            <h2 className="font-bold text-zinc-800 tracking-tight">Recent Payments</h2>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-16">
                                <HandCoins className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-500 font-medium">No payments recorded yet</p>
                                <p className="text-zinc-400 text-sm mt-1">Click "Record Payment" to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/40 border-b border-white">
                                        <tr>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Student</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Fee Type</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Amount</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Method</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Receipt</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Date</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/50">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-white/40 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-zinc-800">{payment.students?.profiles?.full_name}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{payment.students?.classes?.name} {payment.students?.classes?.section}</p>
                                                </td>
                                                <td className="px-5 py-4 text-zinc-600">{payment.fee_structure?.fee_type || 'General'}</td>
                                                <td className="px-5 py-4 font-bold text-zinc-800 tracking-tight">₹{Number(payment.amount_paid).toLocaleString()}</td>
                                                <td className="px-5 py-4 text-zinc-600 capitalize">{payment.payment_method?.replace('_', ' ')}</td>
                                                <td className="px-5 py-4 text-zinc-400 text-xs font-mono">{payment.receipt_number}</td>
                                                <td className="px-5 py-4 text-zinc-500">{payment.payment_date}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[payment.status]}`}>
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
                    <div className="glass-panel overflow-hidden">
                        <div className="p-5 border-b border-white/50 bg-white/30 backdrop-blur-sm">
                            <h2 className="font-bold text-zinc-800 tracking-tight">Fee Structures</h2>
                        </div>
                        {feeStructures.length === 0 ? (
                            <div className="text-center py-16">
                                <Settings2 className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                                <p className="text-zinc-500 font-medium">No fee structures defined</p>
                                <p className="text-zinc-400 text-sm mt-1">Click "Fee Structure" to add one</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/40 border-b border-white">
                                        <tr>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Class</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Fee Type</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Amount</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Due Date</th>
                                            <th className="text-left px-5 py-4 text-zinc-600 font-semibold tracking-wide">Year</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/50">
                                        {feeStructures.map((fs) => (
                                            <tr key={fs.id} className="hover:bg-white/40 transition-colors">
                                                <td className="px-5 py-4 font-semibold text-zinc-800">{fs.classes?.name} {fs.classes?.section}</td>
                                                <td className="px-5 py-4 text-zinc-600">{fs.fee_type}</td>
                                                <td className="px-5 py-4 font-bold text-zinc-800 tracking-tight">₹{Number(fs.amount).toLocaleString()}</td>
                                                <td className="px-5 py-4 text-zinc-500">{fs.due_date || 'N/A'}</td>
                                                <td className="px-5 py-4 text-zinc-400">{fs.academic_year}</td>
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
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 sticky top-0 bg-white/80 backdrop-blur-xl z-10 rounded-t-3xl">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <IndianRupee className="w-5 h-5 text-violet-600" />
                                Record Payment
                            </h2>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
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
                                    value={paymentForm.student_id}
                                    onChange={e => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Fee Type</label>
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
                                    className="input-glass"
                                >
                                    <option value="">Select fee type (optional)...</option>
                                    {feeStructures.map(f => (
                                        <option key={f.id} value={f.id}>{f.fee_type} - ₹{f.amount}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Amount Paid (₹) *</label>
                                <input
                                    type="number"
                                    value={paymentForm.amount_paid}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                    className="input-glass"
                                    placeholder="5000"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Method</label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        className="input-glass"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Status</label>
                                    <select
                                        value={paymentForm.status}
                                        onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}
                                        className="input-glass"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Receipt Number</label>
                                <input
                                    type="text"
                                    value={paymentForm.receipt_number}
                                    onChange={e => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
                                    className="input-glass"
                                    placeholder="Auto-generated if left empty"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200">
                                Cancel
                            </button>
                            <button onClick={handleAddPayment} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Saving...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fee Structure Modal */}
            {showStructureModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
                            <h2 className="text-xl font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-violet-600" />
                                Add Fee Structure
                            </h2>
                            <button onClick={() => setShowStructureModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Class *</label>
                                <select
                                    value={structureForm.class_id}
                                    onChange={e => setStructureForm({ ...structureForm, class_id: e.target.value })}
                                    className="input-glass"
                                >
                                    <option value="">Select class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Fee Type *</label>
                                <input
                                    type="text"
                                    value={structureForm.fee_type}
                                    onChange={e => setStructureForm({ ...structureForm, fee_type: e.target.value })}
                                    className="input-glass"
                                    placeholder="Tuition Fee / Exam Fee / Transport..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={structureForm.amount}
                                        onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })}
                                        className="input-glass"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={structureForm.due_date}
                                        onChange={e => setStructureForm({ ...structureForm, due_date: e.target.value })}
                                        className="input-glass"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Academic Year</label>
                                <input
                                    type="text"
                                    value={structureForm.academic_year}
                                    onChange={e => setStructureForm({ ...structureForm, academic_year: e.target.value })}
                                    className="input-glass"
                                    placeholder="2025-2026"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-zinc-200/50 bg-zinc-50/50 rounded-b-3xl">
                            <button onClick={() => setShowStructureModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-medium hover:bg-white transition text-sm border border-transparent hover:border-zinc-200">
                                Cancel
                            </button>
                            <button onClick={handleAddStructure} disabled={saving}
                                className="flex-1 btn-primary py-2.5">
                                {saving ? 'Saving...' : 'Add Structure'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}