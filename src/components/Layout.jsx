import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden relative print:h-auto print:bg-white print:overflow-visible">
            
            {/* Ambient Background Blobs for Glassmorphism */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none print:hidden" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 blur-[120px] pointer-events-none print:hidden" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-sky-400/10 blur-[100px] pointer-events-none print:hidden" />

            <div className="relative z-50 print:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden relative z-10 print:overflow-visible">
                <div className="print:hidden">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0">
                    {children}
                </main>
            </div>
        </div>
    )
}