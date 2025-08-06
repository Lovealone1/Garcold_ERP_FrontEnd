import "../../styles/globals.css";

export const metadata = {
  title: "Sistema de Ventas",
  description: "Inicio de sesión",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}