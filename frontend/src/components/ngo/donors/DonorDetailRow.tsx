type DonorDetailRowProps = {
  label: string;
  value: string;
};

export function DonorDetailRow({ label, value }: DonorDetailRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
