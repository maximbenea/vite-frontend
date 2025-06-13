import { useRef } from 'react';

export default function ScreenCapture() {

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    const startCapture = async () => {
        try {
            // Getting screen access
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();

            // Set canvas resolution to 720p
            const canvas = canvasRef.current;
            canvas.width = 1280;
            canvas.height = 720;

            const ctx = canvas.getContext('2d');

            intervalRef.current = setInterval(() => {
                //Taking snapshots on the canvas
                ctx.drawImage(video, 0, 0, 1280, 720);

                // Converting image to base64
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);

                // Sending data
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
            }, 4000); // 1 frame/4sec (changeable)

        } catch (err) {
            console.error('Error starting capture:', err);
        }
    };

    const stopCapture = () => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach(track => track.stop());
        clearInterval(intervalRef.current);
    };

    return (
        <div>
            <button onClick={startCapture}>Start Sharing</button>
            <button onClick={stopCapture}>Stop Sharing</button>
            <video ref={videoRef} />
            <canvas ref={canvasRef} style={{ display: 'none' }}/>
        </div>
    );
}