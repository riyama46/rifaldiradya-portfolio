import { Archivo } from "next/font/google";

// Delta SDD section 2: Archivo only, one variable file per style (400/500/600 + italic 500/600).
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-archivo",
});

export const fontVariables = archivo.variable;
