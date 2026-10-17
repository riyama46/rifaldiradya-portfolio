type SkipLinkProps = {
  label: string;
};

export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#content"
      className="fixed top-2 left-2 z-[100] -translate-y-24 bg-accent px-3.5 py-2.5 font-medium text-on-accent focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
