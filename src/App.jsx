import { useEffect, useState } from 'react'

// Tasks imports
import Task1 from './tasks/Task1'

const TASKS = [
  { id: 1, title: 'Random Walk', shortTitle: 'Task 1' },
  { id: 2, title: 'Brownian Motion', shortTitle: 'Task 2' },
  { id: 3, title: 'Blackbody Radiation', shortTitle: 'Task 3' },
  { id: 4, title: 'Photoelectric Effect', shortTitle: 'Task 4' },
  { id: 5, title: 'Hydrogen Spectrum', shortTitle: 'Task 5' },
  { id: 6, title: 'Electron Diffraction', shortTitle: 'Task 6' },
  { id: 7, title: 'Particle in a Box', shortTitle: 'Task 7' },
  { id: 8, title: 'Quantum Cryptography', shortTitle: 'Task 8' },
  { id: 9, title: 'Compton Scattering', shortTitle: 'Task 9' },
  { id: 10, title: 'Hydrogenic Orbitals', shortTitle: 'Task 10' },
]

// Home Page
function HomePage({onEnter}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-[11px] text-neutral-600 tracking-widest mb-6">
        BRITISH PHYSICS OLYMPIAD - COMPUTATIONAL CHALLENGE 2026
      </div>
      <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
        Physics Playground
      </h1>
      <p className="text-neutral-500 text-base max-w-lg mb-3 leading-relaxed">
        Ten interactive quantum mechanics simulations built for the BPhO Computational 
        Challenge 2026.
      </p>
      <p className="text-neutral-600 text-sm max-w-md mb-12 leading-relaxed">
        Each simulation includes the physics background, interactive controls, and real-time visualizations. 
        Use the Sidebar or arrow keys to navigate. 
      </p>
      <button
        onClick={onEnter}
        className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors cursor-pointer"
      >
        Start Exploring →
      </button>
      <div className="mt-6 text-[11px] text-neutral-700">
        ← → arrow keys to navigate between tasks
      </div>
    </div>
  )
}

// Individual Sidebar Item component
function SidebarItem({task, isSelected, onSelect}) {
  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`
        px-5 py-3 cursor-pointer transition-all duration-150 border-1-[3px]
        ${isSelected
          ? 'bg-[#1a1a2e] border-blue-500'
          : 'border-transparent hover:bg-[#16161f]'
        }
      `}
    >
      <div className="text-[11px] text-neutral-600 mb-0.5">
        {task.shortTitle}
      </div>
      <div className={`text-[13px] ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
        {task.title}
      </div>
    </div>
  )
}

// Sidebar component
function Sidebar({selectedId, onSelect}) {
  return (
    <div className="w-[220px] min-w-[220px] bg-[#111118] border-r border-[#222233] flex flex-col py-6 overflow-y-auto">
      <div
        onClick={() => onSelect(null)}
        className="px-5 pb-6 mb-4 border-b border-[#222233] cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="text-[11px] text-neutral-600 tracking-widest mb-1">
          BPhO 2026
        </div>
        <div className="text-base font-semibold text-white">
          The Physics Playground
        </div>
      </div>
      
      {TASKS.map(task => (
        <SidebarItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// Main Panel component
function MainPanel({selectedId, onEnter}) {
  const renderContent = () => {
    if (selectedId === null) return <HomePage onEnter={onEnter} />
    if (selectedId === 1) return <Task1 />
    return (
      <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
        Task {selectedId} - coming soon
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
      {renderContent()}
    </div>
  )
}

// Root component
export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') {
        setSelectedId(prev => {
          if (prev === null) return 1
          return Math.min(prev + 1, 10)
        })
      }
      if (e.key === 'ArrowLeft') {
        setSelectedId(prev => {
          if (prev === null) return null
          if (prev === 1) return null
          return prev - 1
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
  return (
    <div className="flex h-screen w-full">
      <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
      <MainPanel 
        selectedId={selectedId}
        onEnter={() => setSelectedId(1)}
      />
    </div>
  )
}