// src/components/Button.js

export default function Button({ children, onClick, variant = "primary" }) {
  const base = "px-4 py-2 rounded font-medium";
  const styles =
    variant === "danger"
      ? "bg-red-500 text-white"
      : "bg-black text-white";

  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
