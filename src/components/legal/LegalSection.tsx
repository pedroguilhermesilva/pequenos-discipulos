interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-tinta mb-3">{title}</h2>
      <div className="text-oliva space-y-3 text-base">{children}</div>
    </section>
  );
}
