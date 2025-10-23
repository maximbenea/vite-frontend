import { useRef, useState, useEffect } from 'react';
import './ScreenCapture.css';
import { isMobileDevice, isScreenSharingSupported, getMobileBrowser, debounce } from '../utils/mobileUtils';

export default function ScreenCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState(false);
    const chatPollRef = useRef(null);

    // Keep a reference to the current stream for cleanup
    const streamRef = useRef(null);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(isMobileDevice());
        };

        checkMobile();
        const debouncedCheckMobile = debounce(checkMobile, 250);
        window.addEventListener('resize', debouncedCheckMobile);
        
        return () => window.removeEventListener('resize', debouncedCheckMobile);
    }, []);

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
            // Check if screen sharing is supported
            if (!isScreenSharingSupported()) {
                if (isMobile) {
                    setShowMobileWarning(true);
                    setTimeout(() => setShowMobileWarning(false), 5000);
                }
                throw new Error(`Screen sharing is not supported on ${getMobileBrowser()}`);
            }

            // Getting screen access
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: {
                    cursor: "always",
                    displaySurface: "monitor"
                } 
            });
            
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
                
                intervalRef.current = setInterval(async () => {
                    try {
                        const res = await fetch('https://test-api-3wb5.onrender.com/processing');
                        const { processing } = await res.json();
                
                        if (!processing) {
                            ctx.drawImage(video, 0, 0, 1280, 720);
                            const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                
                            await fetch('https://test-api-3wb5.onrender.com/upload-frame', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image_base64: base64Image }),
                            });
                        } else {
                            console.log("Backend is busy, skipping frame");
                        }
                    } catch (err) {
                        console.error('Error checking backend state:', err);
                    }
                }, 10000); // 1 frame/10sec (changeable)
                
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
            
            if (err.name === 'NotAllowedError') {
                alert('Screen sharing permission was denied. Please allow screen sharing to use this feature.');
            } else if (err.name === 'NotSupportedError') {
                alert('Screen sharing is not supported on this device or browser. Please try using a desktop browser.');
            } else {
                alert('Failed to start screen capture. Please try again.');
            }
        }
    };

    // Fetch chat messages from backend
    const fetchChatMessages = async () => {
        try {
            const res = await fetch('https://test-api-3wb5.onrender.com/current_scent');
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
            {showMobileWarning && (
                <div className="mobile-warning">
                    <p>⚠️ Screen sharing may not work properly on mobile devices. For best results, use a desktop browser.</p>
                </div>
            )}
            
            <div className="buttons">
                <button 
                    onClick={startCapture} 
                    disabled={isCapturing}
                    className="start-btn"
                    aria-label="Start screen capture"
                >
                    {isMobile ? 'Start' : 'Start'}
                </button>
                <button 
                    onClick={stopCapture} 
                    disabled={!isCapturing}
                    className="stop-btn"
                    aria-label="Stop screen capture"
                >
                    {isMobile ? 'Stop' : 'Stop'}
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
                    playsInline
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