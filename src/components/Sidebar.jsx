import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
    LayoutDashboard, Users, Building2, UserCircle,
    CalendarCheck, ClipboardSignature, Wallet,
    Award, CalendarDays, BellRing, LogOut, School
} from 'lucide-react'

const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/classes', icon: Building2, label: 'Classes' },
    { path: '/teachers', icon: UserCircle, label: 'Teachers' },
    { path: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { path: '/grades', icon: ClipboardSignature, label: 'Grades' },
    { path: '/fees', icon: Wallet, label: 'Fees' },
    { path: '/activities', icon: Award, label: 'Activities' },
    { path: '/timetable', icon: CalendarDays, label: 'Timetable' },
    { path: '/communication', icon: BellRing, label: 'Communication' },
]

export default function Sidebar({ isOpen, onClose }) {
    const { signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        toast.success('Signed out successfully')
        navigate('/login')
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 glass-panel m-4 z-30 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
        lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-2rem)]
      `}>
                {/* Logo */}
                <div className="flex items-center gap-3 p-6 border-b border-white/40">
                    <img src="/logo.png" alt="Omnia Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    <div>
                        <h1 className="font-bold text-zinc-800 text-sm tracking-tight">Omnia</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Workspace</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 flex-1 overflow-y-auto">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2">
                        Main Menu
                    </p>
                    <ul className="space-y-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        end={item.path === '/'}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                            ${isActive
                                                ? 'bg-violet-500/10 text-violet-700 shadow-sm border border-violet-500/20'
                                                : 'text-zinc-500 hover:bg-white/50 hover:text-zinc-800 border border-transparent'
                                            }`
                                        }
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </NavLink>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Sign Out */}
                <div className="p-4 border-t border-white/40 mt-auto">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}