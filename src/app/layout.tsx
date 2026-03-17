import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readability",
  description:
    "Free Bible reading app with comprehension questions for every New Testament chapter. Like Duolingo for the Bible.",
  openGraph: {
    title: "Readability — Read the Bible. Actually remember it.",
    description:
      "Free Bible reading app with comprehension questions for every New Testament chapter. Like Duolingo for the Bible.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Readability — Read the Bible. Actually remember it.",
    description:
      "Free Bible reading app with comprehension questions for every New Testament chapter. Like Duolingo for the Bible.",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
