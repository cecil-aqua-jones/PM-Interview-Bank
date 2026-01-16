export default function LoginLoading() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div
          style={{
            width: 180,
            height: 32,
            background: "linear-gradient(90deg, #edebe8 25%, #f5f4f2 50%, #edebe8 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: 240,
            height: 18,
            background: "linear-gradient(90deg, #edebe8 25%, #f5f4f2 50%, #edebe8 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius: 4,
            marginBottom: 32,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 48,
            background: "linear-gradient(90deg, #edebe8 25%, #f5f4f2 50%, #edebe8 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius: 12,
            marginBottom: 16,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 48,
            background: "linear-gradient(90deg, #edebe8 25%, #f5f4f2 50%, #edebe8 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius: 12,
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
