import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await signIn(email, password)
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Welcome back!')
            navigate('/')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-zinc-900 bg-gradient-to-br from-zinc-900 via-violet-950 to-indigo-950 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">

                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Omnia Logo" className="w-20 h-20 rounded-2xl mx-auto mb-5 object-cover shadow-xl shadow-violet-500/20" />
                    <h1 className="text-3xl font-bold text-white tracking-tight">Omnia</h1>
                    <p className="text-zinc-300 mt-1">Sign in to your workspace</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-zinc-500 transition-all"
                            placeholder="admin@school.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-zinc-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:from-violet-500/50 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg shadow-violet-500/25"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-8">
                    Omnia Management System
                </p>
            </div>
        </div>
    )
}