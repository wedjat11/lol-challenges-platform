import { ImageResponse } from "next/og";

export const alt = "LOL·RETOS — Retos de League of Legends para Latinoamérica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen Open Graph generada dinámicamente por Next.js.
 * Nota: @vercel/og tiene soporte CSS limitado — usar solo propiedades básicas
 * (no rgba en backgroundImage, no CSS variables, no gradientes complejos).
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080B11",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          borderTop: "3px solid #C89B3C",
        }}
      >
        {/* Top — Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#C89B3C",
              letterSpacing: "0.25em",
            }}
          >
            LOL·RETOS
          </span>
        </div>

        {/* Center — Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#C89B3C",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: "#6B7280",
                letterSpacing: "0.2em",
              }}
            >
              VALIDACIÓN AUTOMÁTICA · LEAGUE OF LEGENDS
            </span>
          </div>

          {/* H1 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "86px",
                fontWeight: 900,
                color: "#F0F2F5",
                lineHeight: 1.0,
              }}
            >
              Reta a
            </span>
            <span
              style={{
                fontSize: "86px",
                fontWeight: 900,
                color: "#C89B3C",
                lineHeight: 1.0,
              }}
            >
              cualquiera.
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: "21px",
              color: "#6B7280",
              marginTop: "4px",
              maxWidth: "620px",
              lineHeight: 1.5,
            }}
          >
            Crea retos personalizados, desafía a tus amigos y valida resultados
            automáticamente con la API oficial de Riot.
          </span>
        </div>

        {/* Bottom — Stats + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Stats */}
          <div style={{ display: "flex", gap: "48px" }}>
            {[
              { value: "6", label: "tipos de retos" },
              { value: "100%", label: "automático" },
              { value: "LA1 · NA", label: "regiones" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#F0F2F5" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #C89B3C",
              borderRadius: "8px",
              padding: "14px 28px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#C89B3C",
                letterSpacing: "0.05em",
              }}
            >
              Empezar gratis →
            </span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "#3B82F6",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
