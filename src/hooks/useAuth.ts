import { useNavigate } from "react-router-dom";
import { SECURITY_CONFIG } from "@/types/auth";

export function useAuth() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("supabaseUserId");
    localStorage.removeItem("loginTimestamp");
    localStorage.removeItem("sessionToken");

    // Clear session storage
    sessionStorage.clear();

    // Navigate to login
    navigate("/", { replace: true });
  };

  const checkSessionValidity = () => {
    const loginTimestamp = localStorage.getItem("loginTimestamp");
    if (!loginTimestamp) return false;

    const now = Date.now();
    const sessionAge = now - parseInt(loginTimestamp);

    if (sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT) {
      handleLogout();
      return false;
    }

    return true;
  };

  const detectProxy = async (): Promise<boolean> => {
    try {
      // Check for common proxy indicators in user agent
      const userAgent = navigator.userAgent.toLowerCase();
      const hasProxyIndicators = ["proxy", "vpn", "tor", "anonymous"].some(
        (indicator) => userAgent.includes(indicator),
      );

      if (hasProxyIndicators) return true;

      // Check for WebRTC leaks (basic proxy detection)
      return new Promise((resolve) => {
        const rtc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        let localIPs: string[] = [];

        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const ip = event.candidate.candidate.match(
              /([0-9]{1,3}(\.[0-9]{1,3}){3})/,
            )?.[0];
            if (ip && !localIPs.includes(ip)) {
              localIPs.push(ip);
            }
          }
        };

        rtc.createDataChannel("");
        rtc.createOffer().then((offer) => rtc.setLocalDescription(offer));

        setTimeout(() => {
          rtc.close();
          // Basic heuristic: multiple IPs might indicate proxy
          resolve(localIPs.length > 2);
        }, 1000);
      });
    } catch {
      return false;
    }
  };

  return {
    handleLogout,
    checkSessionValidity,
    detectProxy,
  };
}
