/**
 * Cross-Browser Compatibility Utility
 * Provides detection, polyfills, and fallbacks for all major browsers
 * 
 * Supported browsers:
 * - Chrome, Edge (Chromium)
 * - Firefox
 * - Safari (macOS/iOS)
 * - Android browsers
 */

// Browser detection
export function detectBrowser() {
  if (typeof window === 'undefined') {
    return { name: 'server', version: '0', mobile: false };
  }

  const ua = navigator.userAgent;
  let name = 'unknown';
  let version = '0';
  let mobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua);

  // Detect browser
  if (/Firefox\/(\d+)/.test(ua)) {
    name = 'firefox';
    version = RegExp.$1;
  } else if (/Edg\/(\d+)/.test(ua)) {
    name = 'edge';
    version = RegExp.$1;
  } else if (/Chrome\/(\d+)/.test(ua)) {
    name = 'chrome';
    version = RegExp.$1;
  } else if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)) {
    name = 'safari';
    // Safari version is in Version/X.X
    if (/Version\/(\d+)/.test(ua)) {
      version = RegExp.$1;
    }
  }

  // iOS detection
  const ios = /iPhone|iPad|iPod/.test(ua);
  const android = /Android/.test(ua);

  return { name, version: parseInt(version, 10), mobile, ios, android };
}

// Feature detection
export function detectFeatures() {
  if (typeof window === 'undefined') {
    return {
      webgl2: false,
      webgl: false,
      webSockets: false,
      localStorage: false,
      serviceWorker: false,
      touchEvents: false,
      pointerEvents: false,
      backdropFilter: false,
      cssGrid: false,
      cssFlexGap: false,
      intersectionObserver: false,
      resizeObserver: false,
      clipboard: false,
      notifications: false,
    };
  }

  // WebGL detection
  let webgl = false;
  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    webgl2 = !!(canvas.getContext('webgl2'));
    webgl = webgl2 || !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    webgl = false;
    webgl2 = false;
  }

  // CSS backdrop-filter support
  let backdropFilter = false;
  try {
    backdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                     CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  } catch (e) {
    backdropFilter = false;
  }

  // CSS flex gap support
  let cssFlexGap = false;
  try {
    const testDiv = document.createElement('div');
    testDiv.style.display = 'flex';
    testDiv.style.gap = '1px';
    cssFlexGap = testDiv.style.gap === '1px';
  } catch (e) {
    cssFlexGap = false;
  }

  return {
    webgl2,
    webgl,
    webSockets: 'WebSocket' in window,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    serviceWorker: 'serviceWorker' in navigator,
    touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointerEvents: 'PointerEvent' in window,
    backdropFilter,
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexGap,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    clipboard: 'clipboard' in navigator,
    notifications: 'Notification' in window,
  };
}

// Get comprehensive browser info
let cachedBrowserInfo = null;
export function getBrowserInfo() {
  if (cachedBrowserInfo) return cachedBrowserInfo;
  
  const browser = detectBrowser();
  const features = detectFeatures();
  
  cachedBrowserInfo = {
    browser,
    features,
    isChromium: ['chrome', 'edge'].includes(browser.name),
    isFirefox: browser.name === 'firefox',
    isSafari: browser.name === 'safari',
    isMobile: browser.mobile,
    isIOS: browser.ios,
    isAndroid: browser.android,
    needsPolyfills: !features.cssFlexGap || !features.intersectionObserver,
  };
  
  return cachedBrowserInfo;
}

// Safe requestAnimationFrame with fallback
export const safeRAF = typeof window !== 'undefined' 
  ? (window.requestAnimationFrame || 
     window.webkitRequestAnimationFrame || 
     ((cb) => setTimeout(cb, 16)))
  : ((cb) => setTimeout(cb, 16));

export const safeCancelRAF = typeof window !== 'undefined'
  ? (window.cancelAnimationFrame || 
     window.webkitCancelAnimationFrame || 
     clearTimeout)
  : clearTimeout;

// Safe clipboard API with fallback
export async function safeClipboardWrite(text) {
  if (typeof window === 'undefined') return false;
  
  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback: execCommand (deprecated but widely supported)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (e) {
    console.warn('Clipboard write failed:', e);
    return false;
  }
}

// Safe fullscreen API (cross-browser)
export function safeRequestFullscreen(element) {
  if (!element) return Promise.reject('No element');
  
  const requestFn = element.requestFullscreen ||
                    element.webkitRequestFullscreen ||
                    element.mozRequestFullScreen ||
                    element.msRequestFullscreen;
  
  if (requestFn) {
    return requestFn.call(element);
  }
  return Promise.reject('Fullscreen not supported');
}

export function safeExitFullscreen() {
  const exitFn = document.exitFullscreen ||
                 document.webkitExitFullscreen ||
                 document.mozCancelFullScreen ||
                 document.msExitFullscreen;
  
  if (exitFn) {
    return exitFn.call(document);
  }
  return Promise.reject('Fullscreen not supported');
}

// Safe visibility API
export function getVisibilityState() {
  if (typeof document === 'undefined') return 'visible';
  
  return document.visibilityState || 
         document.webkitVisibilityState || 
         document.mozVisibilityState || 
         'visible';
}

export function onVisibilityChange(callback) {
  if (typeof document === 'undefined') return () => {};
  
  const eventName = 'visibilitychange';
  document.addEventListener(eventName, callback);
  
  return () => document.removeEventListener(eventName, callback);
}

// Safe pointer/touch event handling
export function addUniversalPointerListener(element, eventType, handler, options = {}) {
  if (!element || typeof window === 'undefined') return () => {};
  
  const { features } = getBrowserInfo();
  const cleanups = [];
  
  // Map event types to pointer/touch/mouse equivalents
  const eventMap = {
    down: { pointer: 'pointerdown', touch: 'touchstart', mouse: 'mousedown' },
    up: { pointer: 'pointerup', touch: 'touchend', mouse: 'mouseup' },
    move: { pointer: 'pointermove', touch: 'touchmove', mouse: 'mousemove' },
    cancel: { pointer: 'pointercancel', touch: 'touchcancel', mouse: 'mouseleave' },
  };
  
  const events = eventMap[eventType];
  if (!events) return () => {};
  
  // Wrapper to normalize touch events
  const normalizeEvent = (e) => {
    if (e.touches && e.touches.length > 0) {
      return {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        target: e.target,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        originalEvent: e,
      };
    }
    return e;
  };
  
  const wrappedHandler = (e) => handler(normalizeEvent(e));
  
  if (features.pointerEvents) {
    // Pointer events (modern, preferred)
    element.addEventListener(events.pointer, wrappedHandler, options);
    cleanups.push(() => element.removeEventListener(events.pointer, wrappedHandler, options));
  } else {
    // Fallback to touch + mouse
    if (features.touchEvents) {
      element.addEventListener(events.touch, wrappedHandler, { ...options, passive: false });
      cleanups.push(() => element.removeEventListener(events.touch, wrappedHandler, options));
    }
    element.addEventListener(events.mouse, wrappedHandler, options);
    cleanups.push(() => element.removeEventListener(events.mouse, wrappedHandler, options));
  }
  
  return () => cleanups.forEach(cleanup => cleanup());
}

// Safe CSS custom property setter
export function setSafeCSSProperty(element, property, value, fallback) {
  if (!element || typeof window === 'undefined') return;
  
  try {
    element.style.setProperty(property, value);
  } catch (e) {
    if (fallback) {
      element.style[property.replace(/^--/, '')] = fallback;
    }
  }
}

// Check if animation should be reduced
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

// Safe IntersectionObserver with fallback
export function createSafeIntersectionObserver(callback, options = {}) {
  if (typeof window === 'undefined') {
    return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
  }
  
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, options);
  }
  
  // Fallback: always consider elements as intersecting
  console.warn('IntersectionObserver not supported, using fallback');
  return {
    observe: (element) => {
      // Immediately call callback with mock entry
      callback([{ target: element, isIntersecting: true, intersectionRatio: 1 }]);
    },
    unobserve: () => {},
    disconnect: () => {},
  };
}

// Safe ResizeObserver with fallback
export function createSafeResizeObserver(callback) {
  if (typeof window === 'undefined') {
    return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
  }
  
  if ('ResizeObserver' in window) {
    return new ResizeObserver(callback);
  }
  
  // Fallback: use window resize event
  console.warn('ResizeObserver not supported, using window resize fallback');
  let observedElements = [];
  
  const handleResize = () => {
    const entries = observedElements.map(el => ({
      target: el,
      contentRect: el.getBoundingClientRect(),
    }));
    if (entries.length > 0) {
      callback(entries);
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  return {
    observe: (element) => {
      observedElements.push(element);
      handleResize();
    },
    unobserve: (element) => {
      observedElements = observedElements.filter(el => el !== element);
    },
    disconnect: () => {
      observedElements = [];
      window.removeEventListener('resize', handleResize);
    },
  };
}

// Export browser info for debugging
export function logBrowserInfo() {
  const info = getBrowserInfo();
  console.log('Browser Info:', info);
  return info;
}
