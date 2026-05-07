import { Check } from "lucide-react";
import { getLanguage } from "@/i18n";

function Cell({ val, highlight }: { val?: boolean | string; highlight?: boolean }) {
  return (
    <td className="px-2 py-2.5 text-center border-b border-border/30 align-middle">
      {val === undefined || val === false ? (
        <span className="text-muted-foreground/40 text-sm">—</span>
      ) : val === true ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
          <Check className="h-3 w-3 text-primary" />
        </span>
      ) : (
        <span className={`text-xs font-medium ${highlight ? "text-primary" : "text-foreground"}`}>{val}</span>
      )}
    </td>
  );
}

function FeatureRow({ label, free, plus, pro, plusHighlight, proHighlight }: {
  label: string;
  free?: boolean | string;
  plus?: boolean | string;
  pro?: boolean | string;
  plusHighlight?: boolean;
  proHighlight?: boolean;
}) {
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="py-2.5 pr-3 text-sm text-foreground border-b border-border/30">{label}</td>
      <Cell val={free} />
      <Cell val={plus} highlight={plusHighlight} />
      <Cell val={pro} highlight={proHighlight} />
    </tr>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={4} className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t border-border/40">
        {label}
      </td>
    </tr>
  );
}

export function PricingComparison() {
  const lang = getLanguage();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "40%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            <th className="text-left pb-3 font-medium">{lang === "es" ? "Característica" : "Feature"}</th>
            <th className="pb-3 font-medium">Free</th>
            <th className="pb-3 font-medium">Plus</th>
            <th className="pb-3 font-medium">Pro</th>
          </tr>
        </thead>
        <tbody>
          <SectionRow label={lang === "es" ? "Tu información de salud" : "Your health information"} />
          <FeatureRow label={lang === "es" ? "Citas, medicación, estudios, diagnósticos" : "Appointments, medications, tests, diagnoses"} free plus pro />
          <FeatureRow label={lang === "es" ? "Médicos e instituciones" : "Doctors & institutions"} free plus pro />
          <FeatureRow label={lang === "es" ? "Cirugías, hospitalizaciones, vacunas" : "Surgeries, hospitalizations, vaccines"} plus pro />
          <FeatureRow label={lang === "es" ? "Archivos adjuntos" : "Attachments"} free="10" plus="100" pro="200" plusHighlight proHighlight />
          <FeatureRow label={lang === "es" ? "Exportar resumen clínico PDF" : "Export clinical summary PDF"} plus pro />

          <SectionRow label={lang === "es" ? "Compartir mi perfil" : "Share my profile"} />
          <FeatureRow label={lang === "es" ? "Compartir mi perfil con otros" : "Share my profile with others"} plus={lang === "es" ? "Hasta 2" : "Up to 2"} pro={lang === "es" ? "Hasta 2" : "Up to 2"} plusHighlight proHighlight />
          <FeatureRow label={lang === "es" ? "Roles (lectura / colaborador)" : "Roles (viewer / collaborator)"} plus pro />

          <SectionRow label={lang === "es" ? "Gestión familiar" : "Family management"} />
          <FeatureRow label={lang === "es" ? "Perfiles de familiares" : "Family profiles"} pro={lang === "es" ? "Hasta 4" : "Up to 4"} proHighlight />
          <FeatureRow label={lang === "es" ? "Backup completo de datos" : "Full data backup"} pro />
          <FeatureRow label={lang === "es" ? "Alertas y recordatorios" : "Alerts & reminders"} pro={lang === "es" ? "Próximamente" : "Coming soon"} proHighlight />
          <FeatureRow label={lang === "es" ? "Integración con calendario" : "Calendar integration"} pro={lang === "es" ? "Próximamente" : "Coming soon"} proHighlight />
        </tbody>
      </table>
    </div>
  );
}
