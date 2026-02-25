// import { useEffect, useState } from "react";

// export default function UsagePage() {
//   const [usage, setUsage] = useState({ apiCalls: 0, voiceMinutes: 0 });

//   useEffect(() => {
//     // Replace with your actual API endpoint
//     fetch("/api/usage")
//       .then((res) => res.json())
//       .then((data) => setUsage(data))
//       .catch(() => setUsage({ apiCalls: "N/A", voiceMinutes: "N/A" }));
//   }, []);

//   return (
//     <div className="min-h-screen bg-black text-white p-6">
//       <h1 className="text-2xl font-bold mb-4">Usage</h1>

//       <div className="bg-zinc-900 p-4 rounded">
//         <p>API Calls: {usage.apiCalls}</p>
//         <p>Voice Minutes: {usage.voiceMinutes}</p>
//       </div>
//     </div>
//   );
// }
