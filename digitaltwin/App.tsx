import { Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import * as THREE from "three";
import MilitaryBase from "./components/MilitaryBase";
import MilitaryHUD from "./components/UI/MilitaryHUD";
import DashboardPage from "./pages/DashboardPage";

// Define control keys for camera movement
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "up", keys: ["KeyQ"] },
  { name: "down", keys: ["KeyE"] },
];

// Navigation component
const Navigation = () => {
  const location = useLocation();
  
  if (location.pathname === '/dashboard') {
    return null; // Hide navigation on dashboard page
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Military Base Digital Twin</h1>
        <Link 
          to="/dashboard" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </nav>
  );
};

function App() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Feature detect WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setWebglSupported(!!gl);
  }, []);

  if (webglSupported === false) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={
                <div className="container mx-auto p-8">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-6">Military Base Digital Twin</h1>
                    <p className="text-xl mb-8">Interactive 3D visualization of a military base with real-time monitoring</p>
                    
                    <Link 
                      to="/dashboard" 
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors"
                    >
                      Launch Dashboard
                    </Link>
                    
                    <div className="mt-16 grid md:grid-cols-2 gap-8 text-left">
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Features</h2>
                        <ul className="space-y-3">
                          <li>• Interactive 3D Military Base</li>
                          <li>• Real-time Gunshot Detection</li>
                          <li>• Weather Monitoring</li>
                          <li>• Troop Deployment Visualization</li>
                          <li>• Strategic Planning Tools</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-green-400">Quick Start</h2>
                        <ol className="space-y-3 list-decimal pl-5">
                          <li>Click "Launch Dashboard" to enter the 3D environment</li>
                          <li>Use mouse to look around</li>
                          <li>Use WASD to move</li>
                          <li>Press H to toggle the weather dashboard</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <KeyboardControls map={controls}>
        <Canvas
          shadows
          camera={{
            fov: 45,
            near: 0.1,
            far: 2000,
            position: [0, 50, 100],
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
          }}
        >
          <Suspense fallback={null}>
            <MilitaryBase />
          </Suspense>
        </Canvas>
        <MilitaryHUD />
      </KeyboardControls>
    </div>
  );
}

export default App;
