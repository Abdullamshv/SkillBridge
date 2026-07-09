"use client";

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full bg-white py-3.5 pl-6 pr-28 text-sm shadow-card outline-none ring-1 ring-transparent focus:ring-brand/40"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
      >
        Search
      </button>
    </form>
  );
}
