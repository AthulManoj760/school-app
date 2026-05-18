import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:bg-white print:overflow-visible">
            <div className="print:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
                <div className="print:hidden">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
                    {children}
                </main>
            </div>
        </div>
    )
}