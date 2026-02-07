import React from 'react'
import './Community.css'

const Community: React.FC = () => {
  return (
    <div className="community">
      <div className="community-grid">
        <div className="sidebar-left">
          <h2 className="sidebar-title">Community Hub</h2>
          <ul className="sidebar-menu">
            <li className="menu-item">
              <span className="menu-text">Insights Exchange 제희한</span>
              <span className="menu-check">☑</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">Insights Exchange 제안한</span>
              <span className="menu-check">☑</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">File Request Aul한</span>
              <span className="menu-check">☑</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">File Requests</span>
              <span className="menu-check">☑</span>
            </li>
          </ul>
          <div className="copyright">©2056 Global Marketing Team. Prinwcy / Tems.</div>
        </div>

        <div className="main-content-area">
          <div className="content-header">
            <div>
              <h2 className="section-title">Insights Exchange 제희한</h2>
              <h3 className="section-subtitle">Annonunt Leange 저렴한</h3>
            </div>
            <button className="new-post-btn">New Post</button>
          </div>

          <div className="insights-cards">
            <div className="insight-card">
              <img 
                src="https://via.placeholder.com/150" 
                alt="Insight" 
                className="insight-image"
              />
              <div className="insight-content">
                <h4 className="insight-title">AI Powteret Laincht</h4>
                <p className="insight-description">Description text here...</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-content">
                <h4 className="insight-title">GenAf in Copywotking</h4>
                <p className="insight-description">Description text here...</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-content">
                <h4 className="insight-title">GemA! Fidett n Ads</h4>
                <p className="insight-description">Description text here...</p>
              </div>
            </div>

            <div className="insight-card">
              <img 
                src="https://via.placeholder.com/150" 
                alt="Insight" 
                className="insight-image"
              />
              <div className="insight-content">
                <h4 className="insight-title">AI Feath leace A ean toredy</h4>
                <p className="insight-description">Description text here...</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-content">
                <h4 className="insight-title">Ikais dilyi-10 A the taskse ha kuony)</h4>
                <p className="insight-description">Description text here...</p>
              </div>
            </div>
          </div>

          <div className="insights-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Resausor</th>
                  <th>Detor</th>
                  <th>Dordtine</th>
                  <th>Sotos</th>
                  <th>Seaus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Q2 Muvkort</td>
                  <td>5</td>
                  <td>Feb 9, 2023</td>
                  <td>Admin</td>
                  <td>-</td>
                  <td>Active</td>
                </tr>
                <tr>
                  <td>Mdxaakereen</td>
                  <td>10</td>
                  <td>Feb 11, 2023</td>
                  <td>Punding</td>
                  <td>-</td>
                  <td>Pending</td>
                </tr>
                <tr>
                  <td>Q2 Salee Report</td>
                  <td>10</td>
                  <td>Feb 31 2020</td>
                  <td>Punding</td>
                  <td>-</td>
                  <td>Pending</td>
                </tr>
                <tr>
                  <td>Module ISO, Time</td>
                  <td>20</td>
                  <td>Jun 31, 2020</td>
                  <td>(Completed)</td>
                  <td>-</td>
                  <td>Completed</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="page-info">S 6077773</span>
            <button className="page-arrow">→</button>
            <span className="page-info">Masly Co X</span>
          </div>
        </div>
      </div>

      <div className="social-footer">
        <a href="#" className="social-link">LinkedIn</a>
        <a href="#" className="social-link">Twitter</a>
        <a href="#" className="social-link">Pinterest</a>
        <a href="#" className="social-link">YouTube</a>
      </div>
    </div>
  )
}

export default Community
