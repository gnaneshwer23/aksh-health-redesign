import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { comparisonData } from "@/lib/content";

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full ${
            i < value ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

export function ComparisonTable() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl">
          How Aksh Health Compares
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead className="text-center">Epic</TableHead>
                <TableHead className="text-center">Nuance DAX</TableHead>
                <TableHead className="text-center">Microsoft</TableHead>
                <TableHead className="text-center text-primary">
                  Aksh Health
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell>
                    <StarRating value={row.epic} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={row.nuance} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={row.microsoft} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={row.aksh} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
