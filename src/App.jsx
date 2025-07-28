import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Register  from "./pages/Register";

function App() {

  return (
      <BrowserRouter>
          {/*<nav className="navbar navbar-expand-lg navbar-light bg-light px-3">*/}
          {/*    /!*<Link className="navbar-brand" to="/">MyApp</Link>*!/*/}
          {/*    <div className="collapse navbar-collapse">*/}
          {/*        <ul className="navbar-nav">*/}
          {/*            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>*/}
          {/*        </ul>*/}
          {/*    </div>*/}
          {/*</nav>*/}

          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
          </Routes>
      </BrowserRouter>
  )
}

export default App
