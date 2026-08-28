type JitterLoaderProps = {
  message: string;
  className?: string;
};

export default function JitterLoader({ message, className = "" }: JitterLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center gap-3 text-gray-400 ${className}`}
    >
      <span aria-hidden="true" className="flex h-5 items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2 w-2 animate-bounce rounded-sm bg-teal-300 motion-reduce:animate-none"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </span>
      <span className="text-xs">{message}</span>
    </div>
  );
}
