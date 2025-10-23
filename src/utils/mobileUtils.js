// Mobile detection utilities
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

export const isPortrait = () => {
  return window.innerHeight > window.innerWidth;
};

// Screen sharing support detection
export const isScreenSharingSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
};

// Mobile browser detection
export const getMobileBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'iOS';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/BlackBerry/.test(userAgent)) {
    return 'BlackBerry';
  } else if (/Windows Phone/.test(userAgent)) {
    return 'Windows Phone';
  }
  
  return 'Desktop';
};

// Check if device supports specific features
export const supportsFeature = (feature) => {
  switch (feature) {
    case 'screenSharing':
      return isScreenSharingSupported();
    case 'touch':
      return isTouchDevice();
    case 'vibrate':
      return 'vibrate' in navigator;
    case 'geolocation':
      return 'geolocation' in navigator;
    default:
      return false;
  }
};

// Mobile-specific constants
export const MOBILE_BREAKPOINTS = {
  SMALL: 480,
  MEDIUM: 768,
  LARGE: 1024
};

export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // iOS Human Interface Guidelines
  RECOMMENDED: 48 // Material Design guidelines
};

// Utility function to add mobile-specific event listeners
export const addMobileEventListeners = (element, events) => {
  if (isTouchDevice()) {
    events.forEach(event => {
      element.addEventListener(event, (e) => {
        e.preventDefault();
        // Add any mobile-specific handling here
      }, { passive: false });
    });
  }
};

// Debounce function for mobile performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for mobile performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
