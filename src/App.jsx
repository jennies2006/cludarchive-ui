import { useState, useEffect } from 'react';
import axios from 'axios';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth'; // Import this
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: 'eu-west-1:dc07c92d-03c4-4bfb-b9a5-7f0fa9170c56',
      region: 'eu-west-1',
      allowGuestAccess: true, // Explicitly enable guest access
    }
  },
  Storage: {
    S3: {
      bucket: 'cloudarchive-project',
      region: 'eu-west-1',
    }
  }
});

function App() {
  const [receipts, setReceipts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false); // New state

  useEffect(() => {
    // Fetch data for table
    axios.get('https://vy7z0d27i5.execute-api.eu-west-1.amazonaws.com/default/receipts')
      .then(res => setReceipts(res.data))
      .catch(err => console.error(err));

    // Force Amplify to get credentials BEFORE showing the uploader
    fetchAuthSession()
      .then(session => {
        console.log("Credentials successfully loaded:", session.credentials);
        setIsAuthReady(true);
      })
      .catch(err => console.error("Auth Error:", err));

  }, [refresh]);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>CloudArchive Dashboard</h1>
        <button onClick={() => setRefresh(r => r + 1)} style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          🔄 Refresh Data
        </button>
      </div>

      <div style={{ border: '2px dashed #ccc', padding: '20px', margin: '20px 0', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
        <h3>Upload a Receipt</h3>
        
        {/* Only show the uploader if the auth credentials are ready */}
        {isAuthReady ? (
          <FileUploader
            acceptedFileTypes={['image/png', 'image/jpeg']}
            maxFileCount={1}
            onUploadSuccess={() => alert("Uploaded! Wait 10 seconds, then click Refresh Data.")}
            onUploadError={(error) => {
              console.error("Upload Error Details:", error);
              alert("Upload Failed! Check the browser console (F12).");
            }}
          />
        ) : (
          <p>Loading AWS Credentials...</p>
        )}
      </div>

      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ backgroundColor: '#333', color: 'white' }}>
          <tr><th>Merchant</th><th>Amount</th><th>Due Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          {receipts.map((r, i) => (
            <tr key={i}>
              <td>{r.merchant}</td><td>{r.amount}</td><td>{r.due_date}</td>
              <td>
                <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '12px', backgroundColor: r.payment_status === 'Unpaid' ? '#ffcccc' : '#ccffcc' }}>
                  {r.payment_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;