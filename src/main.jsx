import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dsa from "./components/Dsa.jsx";
import StudyPartner from "./components/StudyPartner.jsx";
import Internships from "./components/Internships.jsx";
import Resources from "./components/Resources.jsx";
import Hr from "./components/Hr.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import Layout from "./components/Layout.jsx";
import AptitudeQuestions from "./components/AptitudeQuestions.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Layout><App /></Layout> },
  { path: "/dsa", element: <Layout><Dsa /></Layout> },
  { path: "/study-partner", element: <Layout><StudyPartner /></Layout> },
  { path: "/internships", element: <Layout><Internships /></Layout> },
  { path: "/resources", element: <Layout><Resources /></Layout> },
  { path: "/hr", element: <Layout><Hr /></Layout> },
  { path: "/AptitudeQuestions", element: <Layout><AptitudeQuestions /></Layout> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChatProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ChatProvider>
  </StrictMode>
);
