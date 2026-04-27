import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Check, X, ArrowLeft } from 'lucide-react';

const VerifyPage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await axios.get(`${API_URL}/verify/${id}`);
                setData(response.data);
            } catch (err) {
                console.error(err);
                setData({ valid: false });
            } finally {
                setLoading(false);
            }
        };

        verifyCertificate();
    }, [id]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="card-body">
                    <div className="loader" style={{ borderTopColor: 'var(--primary-black)', marginBottom: '1rem' }}></div>
                    <h1>Validating...</h1>
                </div>
            );
        }

        if (!data || !data.valid) {
            return (
                <div className="card-body">
                    <div className="status-icon error">
                        <X size={24} />
                    </div>
                    <h1>Invalid Certificate</h1>
                    <p className="subtitle">The certificate ID was not found.</p>
                    
                    <Link to="/" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <ArrowLeft size={18} /> Back to Portal
                    </Link>
                </div>
            );
        }

        return (
            <div className="card-body">
                <div className="status-icon success">
                    <Check size={24} />
                </div>
                <h1>Verified Original</h1>
                <p className="subtitle">Official KIIT Event Record</p>

                <div className="verify-details">
                    <div className="row">
                        <div className="label">Participant Name</div>
                        <div className="val">{data.name}</div>
                    </div>
                    {data.isWinner && (
                        <>
                            <div className="row">
                                <div className="label">Team Name</div>
                                <div className="val" style={{ color: '#ff2e63', fontWeight: 800 }}>TEAM {data.teamName}</div>
                            </div>
                            <div className="row">
                                <div className="label">Achievement</div>
                                <div className="val" style={{ fontWeight: 800 }}>{data.rank}</div>
                            </div>
                        </>
                    )}
                    <div className="row">
                        <div className="label">Event Name</div>
                        <div className="val">{data.event}</div>
                    </div>
                    <div className="row">
                        <div className="label">Certificate ID</div>
                        <div className="val" style={{ color: 'var(--primary-black)', fontWeight: 700 }}>{data.certificateId}</div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <img 
                        src="/roshni maam.avif" 
                        alt="Signature" 
                        style={{ height: '60px', marginBottom: '0.2rem' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-black)', fontWeight: 800, margin: 0 }}>Dr. ROSHNI PRADHAN</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.1rem' }}>Authorized Signature</p>
                </div>

                <Link to="/" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                    <ArrowLeft size={18} /> Return to Portal
                </Link>
            </div>
        );
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

                {renderContent()}
            </main>

            <footer className="page-footer">
                <p>Designed and Developed by <a href="https://veritasco.tech" target="_blank" rel="noopener noreferrer">veritasco.tech</a></p>
                <p>© All rights reserved.</p>
            </footer>
        </div>
    );
};

export default VerifyPage;
