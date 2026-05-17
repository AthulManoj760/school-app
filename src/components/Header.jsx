import { useAuth } from '../context/AuthContext'

export default function Header({ onMenuClick }) {
    const { user } = useAuth()

    return (
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition"
            >
                <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
                <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
                <div className="w-5 h-0.5 bg-gray-600"></div>
            </button>

            <div className="hidden lg:block">
                <h2 className="text-gray-800 font-semibold">Welcome back! 👋</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 ml-auto">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </span>
                </div>
            </div>
        </header>
    )
}