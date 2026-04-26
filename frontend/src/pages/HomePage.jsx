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
            console.log('--- RESPONSE HEADERS ---', response.headers);
            const participantName = response.headers['x-participant-name'] || response.headers['X-Participant-Name'] || 'Participant';
            let certId = response.headers['x-certificate-id'] || response.headers['X-Certificate-ID'];
            
            if (!certId) {
                console.warn('⚠️ Certificate ID not found in headers, searching in data...');
                // Fallback: If it's a blob, we can't easily read it, but if it was JSON we could.
                // Since this only happens on success, we expect the header.
            }

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


    const copyPostText = () => {
        const frontendUrl = window.location.origin;
        const verifyLink = `${frontendUrl}/verify/${shareData.id}`;
        const text = `I am thrilled to announce that I have successfully completed 𝐃𝐞𝐜𝐨𝐝𝐞 & 𝐃𝐨𝐦𝐢𝐧𝐚𝐭𝐞 𝟐.𝟎! 🚀\n\nIt was an incredible experience that challenged me to solve complex problems and push my technical boundaries. Big thanks to the @School of Computer Engineering, KIIT and the @KIIT Fest organizing committee for this amazing event!\n\nSpecial thanks to @VeritasCo for the official digital support and platform navigation. 💻✨\n\nCheck out my official certificate here: ${verifyLink}\n\n#DecodeDominate #KIITFest #VeritasCo #DigitalExperience #ProblemSolving #TechChallenge`;
        navigator.clipboard.writeText(text);
        alert('LinkedIn post text copied! \n\nTip: To make the @mentions active (blue), simply delete and re-type the "@" symbol after pasting on LinkedIn.');
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

                                    <div style={{ marginTop: '2rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>COPY THIS & SHARE ON LINKEDIN</p>
                                        <div style={{
                                            background: '#fcfcfd',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            textAlign: 'left',
                                            position: 'relative',
                                            marginBottom: '1rem'
                                        }}>
                                            <p style={{
                                                fontSize: '0.8rem',
                                                color: '#444',
                                                lineHeight: '1.6',
                                                margin: 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 4,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                fontStyle: 'italic'
                                            }}>
                                                "I am thrilled to announce that I have completed 'Decode & Dominate 2.0'! 🚀 Check out my official certificate here: {window.location.origin}/verify/{shareData.id}..."
                                            </p>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '40px',
                                                background: 'linear-gradient(transparent, #fcfcfd)',
                                                borderRadius: '0 0 12px 12px'
                                            }}></div>
                                        </div>
                                        <button onClick={copyPostText} className="submit-btn" style={{ width: '100%', borderRadius: '12px' }}>
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
