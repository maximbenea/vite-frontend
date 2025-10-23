
# Vite + React Frontend  
  
This is a React-based frontend application built with Vite. It provides a screen-capturing utility that sends frames to a backend service and displays chat messages.  
  
## Features  
  
-   **Screen Capturing**: Captures the user's screen and sends frames to a backend service.  
-   **Chat Display**: Fetches and displays chat messages from a backend service.  
-   **Start/Stop Controls**: Allows the user to start and stop the screen capture.  
-   **Live Preview**: Shows a live preview of the screen being captured.  
  
## Getting Started  
  
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.  
  
### Prerequisites  
  
- [Node.js](https://nodejs.org/) (version 14 or later)  
- [npm](https://www.npmjs.com/) (or [Yarn](https://yarnpkg.com/))  
  
### Installation  
  
1. Clone the repository:  
  
```bash
  git clone https://your-repository-url.com/ 
  ```  
2. Navigate to the project directory:  
  
```bash
  cd vite-react-frontend 
  ```  
3. Install the dependencies:  
  
```bash
  npm install 
  ```  
  or  
  
```bash 
  yarn install 
  ```  
## Usage  
  
### Development Server  
  
To run the application in development mode, use the following command:  
  
```bash  
npm run dev
```  
  
This will start a development server, and you can view the application by navigating to `http://localhost:5173` in your web browser.  
  
### Building for Production  
  
To create a production build of the application, run the following command:  
  
```bash  
npm run build
```  
  
This will generate a `dist` folder containing the optimized and minified production-ready files.  
  
## API Endpoints  
  
This frontend application communicates with a backend service for the following functionalities:  
  
-   **Frame Uploads**: Sends captured screen frames to `http://localhost:8000/upload-frame`.  
-   **Chat Messages**: Fetches chat messages from `http://localhost:8000/chat-messages`.  
  
Make sure you have the backend service running and configured to listen on `http://localhost:8000`.  
  
## Linting  
  
To lint the codebase for any errors or style issues, run the following command:  
  
```bash  
npm run lint
```
