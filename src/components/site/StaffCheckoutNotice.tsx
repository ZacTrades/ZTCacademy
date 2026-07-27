import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function StaffCheckoutNotice({
  title = "Staff account",
  description = "Checkout is disabled for admin and moderator accounts. Use a regular member account to test purchases.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-gold/35 bg-gold/10 p-4">
      <Badge variant="outline" className="border-gold/40 text-gold">
        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
        {title}
      </Badge>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
