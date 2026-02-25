// src/components/Footer.js

export default function Footer() {
  return (
    <footer className="text-center text-sm text-gray-500 py-6 border-t">
      © {new Date().getFullYear()} VoiceAI · Build AI Voice Agents
    </footer>
  );
}
