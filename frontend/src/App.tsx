import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Classroom from './pages/Classroom'
import Community from './pages/Community'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learning" element={<Classroom />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
