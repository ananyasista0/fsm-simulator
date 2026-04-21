import { useEffect } from 'react'
import Lenis from 'lenis'

export default function LenisSetup() {
  useEffect(() => {
    // Select the workspace which is our scrollable container
    const wrapper = document.querySelector('.workspace')
    if (!wrapper) return

    const lenis = new Lenis({
      wrapper: wrapper,
      content: wrapper.firstElementChild, // the .workspace-content div
      lerp: 0.1, // controls smoothness
      duration: 1.2,
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle nested scroll propagation if needed
    // The workspace will now have butter-smooth scrolling

    return () => {
      lenis.destroy()
    }
  }, [])

  return null
}
