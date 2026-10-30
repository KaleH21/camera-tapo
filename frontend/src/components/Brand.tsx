import { Camera } from 'lucide-react'

export function Brand({ iconSize = 21 }: { iconSize?: number }) {
  return <div className="brand">
    <div className="brand-mark"><Camera size={iconSize} /></div>
    <span>Tapo<span className="brand-light">Home</span></span>
  </div>
}

