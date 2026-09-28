type SkipLinkProps = {
  label: string;
};

export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#content"
      className="fixed top-3 left-4 z-[100] -translate-y-24 rounded-button bg-text px-4 py-2.5 font-medium text-bg focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
