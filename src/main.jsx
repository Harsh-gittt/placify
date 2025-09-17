import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Dsa from './components/Dsa.jsx'
import StudyPartner from './components/StudyPartner.jsx'
import Internships from './components/Internships.jsx'
import Resources from './components/Resources.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/dsa",
    element: <Dsa />
  },
  {
    path: "/study-partner",
    element: <StudyPartner />
  },
  {
    path: "/internships",
    element: <Internships />
  },
  {
    path: "/resources",
    element: <Resources />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
