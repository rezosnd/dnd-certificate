import React, { useState } from 'react';
import axios from 'axios';

const HomePage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shareData, setShareData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setShareData(null);

        if (!email) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            // Sanitize: Remove trailing slash if present
            if (API_URL.endsWith('/')) {
                API_URL = API_URL.slice(0, -1);
            }
            
            const response = await axios.post(`${API_URL}/generate`, { email }, {
                responseType: 'blob'
            });

            // Extract headers (handle variations in Axios normalization)
            const participantName = response.headers['x-participant-name'] || response.headers['X-Participant-Name'] || 'Participant';
            const certId = response.headers['x-certificate-id'] || response.headers['X-Certificate-ID'];
            const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];

            let cleanName = participantName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            let filename = `${cleanName}_dnd2.0.jpg`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/);
                if (filenameMatch) {
                    filename = filenameMatch[1] || filenameMatch[2];
                }
            }

            if (!filename.toLowerCase().endsWith('.jpg') && !filename.toLowerCase().endsWith('.jpeg')) {
                filename += '.jpg';
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'image/jpeg' }));
            const link = document.createElement('a');
            link.href = url;

            // Force .jpg extension logic
            let finalFilename = filename;
            if (!finalFilename.toLowerCase().endsWith('.jpg') && !finalFilename.toLowerCase().endsWith('.jpeg')) {
                finalFilename += '.jpg';
            }

            link.setAttribute('download', finalFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Certificate downloaded successfully!');
            setShareData({ name: participantName, id: certId });
            setEmail('');
        } catch (err) {
            console.error('FULL ERROR OBJECT:', err);
            if (err.response) {
                if (err.response.status === 404) {
                    setError('No record found in our database.');
                } else {
                    setError(`Server Error (${err.response.status}). Please try again later.`);
                }
            } else if (err.request) {
                setError('Network Error: Cannot reach the backend. Check your VITE_API_URL or CORS settings.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
        
        // Link to the smart share route on the backend
        const smartShareLink = `${API_URL}/share/${shareData.id}`;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(smartShareLink)}`;
        window.open(shareUrl, '_blank');
    };

    const copyPostText = () => {
        const frontendUrl = window.location.origin;
        const verifyLink = `${frontendUrl}/verify/${shareData.id}`;
        const text = `I am thrilled to announce that I have successfully completed 'Decode & Dominate 2.0'! 🚀\n\nIt was an incredible experience that challenged me to solve complex problems and push my technical boundaries. Big thanks to the School of Computer Engineering, KIIT (@School of Computer Engineering, KIIT) and the KIIT Fest organizing committee for this amazing event!\n\nSpecial thanks to VeritasCo (@VeritasCo) for the official digital support and platform navigation. 💻✨\n\nCheck out my official certificate here: ${verifyLink}\n\n#DecodeDominate #SchoolOfComputerEngineering #KIITUniversity #KIITFest #VeritasCo #DigitalExperience #ProblemSolving #TechChallenge`;
        navigator.clipboard.writeText(text);
        alert('LinkedIn post text copied! You can now paste it directly on your LinkedIn post.');
    };

    const copyLink = () => {
        const frontendUrl = window.location.origin;
        const verifyLink = `${frontendUrl}/verify/${shareData.id}`;
        navigator.clipboard.writeText(verifyLink);
        alert('Verification link copied to clipboard!');
    };

    return (
        <div className="app-container">
            <main className="main-card">
                <img
                    src="/mascot.png"
                    className="card-watermark"
                    alt="watermark"
                />

                <header className="card-header">
                    <img src="/kiit-cse_logo.webp" alt="KIIT" />
                    <img src="/kiitfestwatermark.avif" className="logo-center" alt="KIITFEST" />
                </header>

                <div className="card-body">
                    {!success ? (
                        <>
                            <h1>Download Your Certificate</h1>
                            <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '2.5rem' }}>Decode & Dominate 2.0</p>

                            <form onSubmit={handleSubmit} className="form-container">
                                <div className="input-group">
                                    <input
                                        type="email"
                                        className="styled-input"
                                        style={{ borderBottom: 'none' }}
                                        placeholder="Registered Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? <div className="loader"></div> : "Download Certificate"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="success-view animate-fade-in">
                            <div className="status-icon success" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>✓</div>
                            <h1 style={{ color: 'var(--success)', marginTop: '1rem' }}>CONGRATULATIONS!</h1>
                            <p className="subtitle" style={{ marginBottom: '2rem', fontSize: '0.85rem' }}>Your certificate has been generated and downloaded.</p>

                            {shareData && (
                                <div className="share-highlight" style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>VERIFICATION LINK</p>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        background: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '1.5rem',
                                        overflow: 'hidden'
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: '0.75rem',
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {`${window.location.origin}/verify/${shareData.id}`}
                                        </code>
                                        <button onClick={copyLink} style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#0077b5',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            COPY
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={handleShare} className="share-btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}>
                                            Share
                                        </button>
                                        <button onClick={copyPostText} className="share-btn-secondary" style={{ flex: 1.5, padding: '1rem', fontSize: '1rem' }}>
                                            Copy Post Text
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { setSuccess(''); setShareData(null); }}
                                style={{ marginTop: '2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                            >
                                Generate another certificate
                            </button>
                        </div>
                    )}

                    {error && <div style={{ color: 'var(--error)', marginTop: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{error}</div>}
                </div>
            </main>

            <footer className="page-footer">
                <p>Designed and Developed by <a href="https://veritasco.tech" target="_blank" rel="noopener noreferrer">veritasco.tech</a></p>
                <p>© All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;
