import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AudiencePage from "./pages/AudiencePage";
import AdminPage from "./pages/AdminPage";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "./App.css";
import Footer from "./pages/Footer";

function App() {
  const [count, setCount] = useState(0);
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AudiencePage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
          <Footer/>
        </BrowserRouter>
      </QueryClientProvider>
    </>
  );
}

export default App;
