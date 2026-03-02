import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { VoiceAgentProvider } from "./context/VoiceAgentContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AuthProvider>
          <VoiceAgentProvider>
            <Navbar />
            {children}
          </VoiceAgentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
