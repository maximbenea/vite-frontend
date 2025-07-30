import { useRef, useState, useEffect } from 'react';
import './ScreenCapture.css';

export default function ScreenCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const chatPollRef = useRef(null);

    // Keep a reference to the current stream for cleanup
    const streamRef = useRef(null);

    const stopCapture = () => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach(track => track.stop());
        clearInterval(intervalRef.current);
        setIsCapturing(false);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        // Remove event listeners from previous stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.onended = null;
            });
            streamRef.current = null;
        }
        // Stop chat polling
        if (chatPollRef.current) {
            clearInterval(chatPollRef.current);
            chatPollRef.current = null;
        }
    };

    const startCapture = async () => {
        try {
            // Getting screen access
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;
            video.onloadedmetadata = async () => {
                await video.play();
                // Set canvas resolution to 720p
                const canvas = canvasRef.current;
                canvas.width = 1280;
                canvas.height = 720;
                const ctx = canvas.getContext('2d');
                setIsCapturing(true);
                intervalRef.current = setInterval(() => {
                    ctx.drawImage(video, 0, 0, 1280, 720);
                    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                    fetch('http://localhost:8000/upload-frame', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image_base64: base64Image }),
                    })
                        .then(data => {
                            console.log('Frame uploaded successfully:', data);
                        })
                        .catch(error => {
                            console.error('Error uploading frame:', error);
                        });
                }, 10000); // 1 frame/8sec (changeable)
                // Listen for browser 'Stop sharing' (WebRTC indicator)
                stream.getTracks().forEach(track => {
                    track.onended = () => {
                        stopCapture();
                    };
                });
                // Start chat polling
                fetchChatMessages();
                chatPollRef.current = setInterval(fetchChatMessages, 5000);
            };
        } catch (err) {
            console.error('Error starting capture:', err);
            setIsCapturing(false);
        }
    };

    // Fetch chat messages from backend
    const fetchChatMessages = async () => {
        try {
            const res = await fetch('http://localhost:8000/chat-messages');
            const data = await res.json();
            if (typeof data.message === 'string') {
                setChatMessages([data.message]);
            } else {
                setChatMessages([]);
            }
        } catch (err) {
            setChatMessages([]);
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (chatPollRef.current) {
                clearInterval(chatPollRef.current);
            }
        };
    }, []);

    return (
        <div className="container">
            <div className="buttons">
                <button 
                    onClick={startCapture} 
                    disabled={isCapturing}
                    className="start-btn"
                >
                    Start
                </button>
                <button 
                    onClick={stopCapture} 
                    disabled={!isCapturing}
                    className="stop-btn"
                >
                    Stop
                </button>
            </div>
            {isCapturing && (
                <div className="status-line">
                    <span className="status-dot" />
                    <span className="status-text">Current status: Active</span>
                </div>
            )}
            <div className="preview">
                <video 
                    ref={videoRef} 
                    autoPlay
                    muted
                    className="preview-video"
                    style={{ display: isCapturing ? 'block' : 'none' }}
                />
            </div>
            {isCapturing && (
                <div className="chat-window">
                    <div className="chat-title">Chat</div>
                    <div className="chat-messages">
                        {chatMessages.length === 0 ? (
                            <div className="chat-empty">No messages yet.</div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div className="chat-message" key={idx}>{msg}</div>
                            ))
                        )}
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}