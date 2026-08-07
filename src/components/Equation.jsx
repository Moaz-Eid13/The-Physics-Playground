export function Equation({ children }) {
  return (
    <div className="bg-[#0a0a0f] border border-[#222233] rounded px-5 py-4 my-3 overflow-x-auto">
      <div className="font-mono text-[15px] text-blue-400 tracking-wide">
        {children}
      </div>
    </div>
  )
}

// For inline math within a sentence
export function InlineEq({ children }) {
  return (
    <span className="font-mono text-blue-400">
      {children}
    </span>
  )
}