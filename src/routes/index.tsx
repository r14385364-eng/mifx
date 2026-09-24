import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import onboardingLegal from "@/assets/onboarding-legal.png";
import onboardingSkill from "@/assets/onboarding-demo.png";
import onboardingFitur from "@/assets/onboarding-fitur.png";
import { AppLogo } from "@/components/AppLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gotrade — Aplikasi Trading Online Resmi" },
      {
        name: "robots",
        content: "noimageindex, nosnippet, noarchive, max-snippet:0, max-image-preview:none",
      },
    ],
  }),
  component: Index,
});

const slides = [
  {
    image: onboardingLegal,
    alt: "Ilustrasi trader memegang ponsel dengan grafik candlestick dan gembok keamanan",
    title: "Trading Forex Legal dan Aman di Broker Teregulasi",
  },
  {
    image: onboardingSkill,
    alt: "Ilustrasi trader berlatih trading dengan grafik dan ikon mata uang",
    title: "Asah Skill Trading Dengan Berlatih",
  },
  {
    image: onboardingFitur,
    alt: "Ilustrasi fitur trading: skor sentimen, breaking news, dan sinyal emas",
    title: "Trading Lebih Percaya Diri Dengan Berbagai Fitur",
  },
];

function Index() {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  // Auto-advance carousel; pauses while the user is dragging
  useEffect(() => {
    if (dragging) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [dragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };

  const handlePointerUp = () => {
    if (startX.current === null) return;
    const delta = drag;
    startX.current = null;
    setDragging(false);
    setDrag(0);
    if (delta < -60 && index < slides.length - 1) setIndex(index + 1);
    else if (delta > 60 && index > 0) setIndex(index - 1);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-background">
      {/* Brand */}
      <header className="flex items-center justify-center pt-5">
        <AppLogo size="md" />
      </header>

      {/* Carousel */}
      <div
        className="mt-2 flex-1 select-none overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
            transition: dragging ? "none" : "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.title}
              className="flex h-full w-full shrink-0 items-center justify-center px-5"
            >
              <img
                src={slide.image}
                alt={slide.alt}
                width={880}
                height={1008}
                draggable={false}
                className="max-h-full w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="px-6">
        <h1 className="min-h-[3.5rem] text-center text-xl font-bold leading-snug tracking-tight text-foreground">
          {slides[index]?.title}
        </h1>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={
              i === index
                ? "h-1.5 w-6 rounded-full bg-primary transition-all duration-300"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-300 hover:bg-muted-foreground/50"
            }
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 px-5 pb-8 pt-6">
        <Link
          to="/register"
          className="block w-full rounded-lg bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/80"
        >
          Daftar Sekarang
        </Link>
        <Link
          to="/login"
          className="block w-full rounded-lg border border-primary py-3.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/5 active:bg-primary/10"
        >
          Login ke Akun Anda
        </Link>
      </div>
    </div>
  );
}
