import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/students', icon: '👨‍🎓', label: 'Students' },
    { path: '/attendance', icon: '✅', label: 'Attendance' },
    { path: '/grades', icon: '📝', label: 'Grades' },
    { path: '/fees', icon: '💰', label: 'Fees' },
    { path: '/activities', icon: '🏆', label: 'Activities' },
    { path: '/timetable', icon: '🗓️', label: 'Timetable' },
    { path: '/communication', icon: '📢', label: 'Communication' },
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
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
                {/* Logo */}
                <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">🏫</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-sm">School Manager</h1>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                        Main Menu
                    </p>
                    <ul className="space-y-1">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/'}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`
                                    }
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sign Out */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition w-full"
                    >
                        <span className="text-lg">🚪</span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}