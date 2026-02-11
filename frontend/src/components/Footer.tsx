import React from 'react'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <h2 className="footer-logo">Global Fundraising Lab</h2>
        </div>
        
        <div className="footer-right">
          <div className="footer-column">
            <h3 className="footer-column-title">JOIN US</h3>
            <a 
              href="https://sites.google.com/globalgn.org/gflab/sign-up?authuser=0"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Sign up
            </a>
            <a 
              href="/"
              className="footer-link"
            >
              Login
            </a>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">GET HELP</h3>
            <a 
              href="/learning"
              className="footer-link"
            >
              Class room
            </a>
            <a 
              href="/hub"
              className="footer-link"
            >
              Collaboration Hub
            </a>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">CONTACT US</h3>
            <a 
              href="#"
              className="footer-link"
            >
              Global Contacts
            </a>
            <a 
              href="https://sites.google.com/globalgn.org/gflab/contacts"
              className="footer-link"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="footer-copyright">
          Copyright ©Good Neighbors All rights reserved | Powered by Good Neighbors Global Partnership Center.
        </p>
        <div className="footer-external-links">
          <a 
            href="https://www.goodneighbors.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-external-link"
          >
            Global Website
          </a>
          <span className="footer-separator">|</span>
          <a 
            href="https://gnware.goodneighbors.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-external-link"
          >
            GN Portal
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
