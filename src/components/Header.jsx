import { useAuth } from '../context/AuthContext'
import { Menu, Bell } from 'lucide-react'

export default function Header({ onMenuClick }) {
    const { user } = useAuth()

    return (
        <header className="glass-panel mx-4 mt-4 mb-2 lg:mx-8 lg:mt-8 lg:mb-4 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-600 hover:bg-white/50 transition border border-transparent hover:border-white"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Mobile Logo */}
                <div className="flex items-center gap-2 lg:hidden">
                    <img src="/logo.png" alt="Omnia" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                    <h1 className="font-bold text-zinc-800 text-lg tracking-tight">Omnia</h1>
                </div>
            </div>

            {/* Desktop Welcome Text */}
            <div className="hidden lg:block">
                <h2 className="text-zinc-800 font-semibold tracking-tight">Welcome back! 👋</h2>
                <p className="text-zinc-500 text-sm">{user?.email || 'Admin User'}</p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 ml-auto">
                <button className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-md shadow-violet-600/20 border border-white">
                    <span className="text-white text-sm font-bold">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                </div>
            </div>
        </header>
    )
}