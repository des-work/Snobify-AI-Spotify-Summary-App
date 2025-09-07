import React from "react";

export default function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>🎵 Snobify Music Analysis</h1>
      <p>App is loading successfully!</p>
      <p>If you can see this, the React app is working.</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '5px',
        border: '1px solid #ccc'
      }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>Check if the server is running on http://127.0.0.1:8899</li>
          <li>Check browser console for any errors</li>
          <li>Try loading the full app</li>
        </ol>
      </div>
    </div>
  );
}
