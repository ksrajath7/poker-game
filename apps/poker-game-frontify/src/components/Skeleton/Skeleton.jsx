// Skeleton.jsx
export default function Skeleton({ width = "w-full", height = "h-4", rounded = "rounded", className = "" }) {
    return (
        <div className={`bg-gray-200 animate-pulse ${width} ${height} ${rounded} ${className}`}></div>
    );
}
