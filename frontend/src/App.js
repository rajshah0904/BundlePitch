import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BundlePitchApp from "./components/BundlePitchApp";
import LandingPage from "./components/LandingPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<BundlePitchApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;