import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[Paymint App Crash Caught]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#09090C", color: "#F2F2F7",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 24, textAlign: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: "rgba(255,96,88,0.12)",
            border: "1px solid rgba(255,96,88,0.3)", display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: 16, fontSize: 24
          }}>
            ⚠️
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>Something went wrong</h2>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(242,242,247,0.6)", maxWidth: 320, lineHeight: 1.5 }}>
            {this.state.error?.message || "An unexpected error occurred while starting Paymint."}
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
              window.location.reload();
            }}
            style={{
              padding: "12px 24px", borderRadius: 100, border: "none",
              background: "linear-gradient(135deg, #4A9EFF, #1A5FC8)",
              color: "#FFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 18px rgba(74,158,255,0.4)"
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
