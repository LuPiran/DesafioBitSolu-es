import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import "@fontsource-variable/ibm-plex-sans"
import "./index.css"
import App from "./App.tsx"

gsap.registerPlugin(useGSAP)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
