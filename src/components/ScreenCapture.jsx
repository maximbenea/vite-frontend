import { useRef, useState, useEffect } from 'react';
import './ScreenCapture.css';

export default function ScreenCapture() {

    // Logic Part

    // Declaring variables
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const chatWebSocketRef = useRef(null);
    const lastFrameRef = useRef(null);

    // Keeping a reference for the current stream is crucial for further clean up
    const streamRef = useRef(null);

    // Websockets handling
    const connectWebsocket = () => {
        try {
            const WS_URL = "wss://fastapi-backend-i18f.onrender.com/ws/web";      // Change later in production
            chatWebSocketRef.current = new WebSocket(WS_URL);    // Reference to current connection

            chatWebSocketRef.current.onopen = () => {
                console.log('WebSocket opened');
            };

            chatWebSocketRef.current.onmessage = (event) => {
                // Gracefully handling data parsing
                try {
                    const data = JSON.parse(event.data);
                    if (data.message) {
                        setChatMessages([data.message]);    // Specifically overrides the whole array
                        console.log("Received message", data.message);
                    }
                } catch (e) {
                    console.error("Error parsing websocket data", e);
                }
            };

            chatWebSocketRef.current.onclose = () => {
                console.log('WebSocket closed, attempting to reconnect ...');
                setTimeout(connectWebsocket, 2000);
            };

            chatWebSocketRef.current.onerror = (e) => {
                console.error("WebSocket error: ", e);
            };
        } catch (e) {
            console.error("Failed to connect to WebSocket", e);
        }
    }

    const disconnectWebsocket = () => {
        if (chatWebSocketRef.current) {
            // Close the current session
            chatWebSocketRef.current.close();
            chatWebSocketRef.current = null;
        }
    }

    // A crucial function for optimization. Checks whether the frames have changed significantly enough
    // in order to save bandwidth and computational resources on the backend
    const hasSignificantDifference = (currentFrame) => {
        if (!lastFrameRef.current) {
            return true;
        }
        const lastFrame = lastFrameRef.current;
        let differences = 0;
        const threshold = 0.1;      // at least 10% of the pixels have to be different

        // Check only every 10th pixels for the sake of speed
        for (let i = 0; i < currentFrame.length; i+=10) {
            if (Math.abs(currentFrame[i] - lastFrame[i]) > 30) {    // has the color changed considerably
                differences += 1;
            }
        }
        // Calculate the change ration based on the total number of changes
        const changeRatio = differences / (currentFrame.length / 10);
        return changeRatio > threshold;
    }

    const stopCapture = () => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach(track => track.stop());
        // Prevent the loop from running in background
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
        // Disconnect WebSocket
        disconnectWebsocket();
    }

    const startCapture = async () => {
        try {
            // Through the Web API get the MediaStore object and store it into stream for future access without re-rendering
            const stream = await navigator.mediaDevices.getDisplayMedia({video: true});
            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;

            // Wait until video loads its metadata
            video.onloadedmetadata = async () => {
                // Draw the canvas the user will see as screen share preview
                await video.play();
                const canvas = canvasRef.current;

                canvas.width = 1280;
                canvas.height = 720;

                const ctx = canvas.getContext('2d');
                setIsCapturing(true);
                // Set up an interval that will run the code every 10s(changeable)
                intervalRef.current = setInterval(async () => {
                    try {
                        ctx.drawImage(video, 0, 0, 1280, 720);

                        // Create optimized hidden canvas
                        const optimizedCanvas = document.createElement('canvas');
                        const optimizedCtx = optimizedCanvas.getContext('2d');
                        optimizedCanvas.width = 320;
                        optimizedCanvas.height = 240;

                        // Draw scaled image with center crop, thus focusing only on the center of screen
                        const sourceWidth = 1280;
                        const sourceHeight = 720;
                        const cropSize = Math.min(sourceWidth, sourceHeight) * 0.8; // 80% crop
                        const cropX = (sourceWidth - cropSize) / 2;
                        const cropY = (sourceHeight - cropSize) / 2;

                        optimizedCtx.drawImage(
                            canvas,
                            cropX, cropY, cropSize, cropSize,
                            0, 0, 320, 240
                        );

                        // Get image data for the frame
                        const imageData = optimizedCtx.getImageData(0, 0, 320, 240);
                        const currentFrame = imageData.data;

                        // Check if frame has significant changes
                        if (hasSignificantDifference(currentFrame)) {
                            lastFrameRef.current = currentFrame;

                            // Lower the quality for faster processing
                            const base64Image = optimizedCanvas.toDataURL('image/jpeg', 0.6);

                            await fetch('https://fastapi-backend-i18f.onrender.com/upload-frame', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({image_base64: base64Image}),
                            });

                            console.log("Frame sent for processing");
                        } else {
                            console.log("Frame skipped, no significant changes");
                        }

                    } catch (e) {
                        console.error("Error parsing frame", e);
                    }
                }, 2000) // the interval

                // Listen for browser 'Stop sharing'
                stream.getTracks().forEach(track => {
                    track.onended = () => {
                        stopCapture();
                    };
                });
                connectWebsocket();

            }
        } catch (e) {
            console.error(e);
            setIsCapturing(false);
        }
    }

    // Cleanup Websocket, for additional safety
    useEffect(() => {
        return () => {
            disconnectWebsocket();
        };
    }, []);

    // Visual components
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
    )
}