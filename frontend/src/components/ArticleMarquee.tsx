"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UserStar, ChevronLeft, ChevronRight } from "lucide-react";

export interface Article {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string;
  image_url?: string;
  published_at: string;
}

export default function ArticleMarquee({ articles }: { articles: Article[] }) {
  // A consistent tech/AI related unsplash image collection for placeholders
  const placeholderImages = [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80",
    "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500&q=80",
  ];

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden py-12 md:py-24">
      <div>
        <svg
          className="absolute right-0 bottom-0 text-neutral-200 dark:text-neutral-800"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_494_1104)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_494_1104">
              <rect fill="transparent" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center px-6 text-center lg:px-0">
          <div className="backdrop-blur-md bg-black/40 border border-white/5 p-8 rounded-3xl flex flex-col items-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#BFF549] text-black">
              <UserStar className="h-6 w-6" />
            </div>

            <h1 className="relative mb-4 font-medium text-4xl text-white tracking-tight sm:text-5xl">
              Latest AI Intelligence
              <svg
                className="absolute -top-2 -right-8 -z-10 w-24 text-neutral-200/20 dark:text-neutral-800/20"
                fill="currentColor"
                height="86"
                viewBox="0 0 108 86"
                width="108"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M38.8484 16.236L15 43.5793L78.2688 15L18.1218 71L93 34.1172L70.2047 65.2739"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="28"
                />
              </svg>
            </h1>
            <p className="max-w-2xl text-neutral-300">
              B.L.A.S.T. aggregates essential insights from top tech sources,
              empowering you with seamless intelligence.
            </p>
          </div>
        </div>

        <div className="relative w-full">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />

          <div className="relative group">
            {/* Left Arrow */}
            <button 
              onClick={scrollLeft}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur hover:bg-[#BFF549] hover:text-black text-white p-3 rounded-full border border-white/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-12 py-4 scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {articles.slice(0, 15).map((article, index) => (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group/card flex w-72 shrink-0 snap-center flex-col"
                  key={article.id || index}
                >
                  <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-border shadow-xl">
                    <img
                      alt={article.title}
                      className="h-full w-full object-cover grayscale transition-all duration-300 group-hover/card:grayscale-0 group-hover/card:scale-105"
                      src={article.image_url || placeholderImages[index % placeholderImages.length]}
                    />
                    <div className="absolute top-2 right-2 rounded-md bg-[#BFF549] px-2 py-1 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold text-black uppercase tracking-wider">{article.source}</span>
                    </div>
                    <div className="absolute bottom-0 w-full bg-background/95 p-4 backdrop-blur transition-all duration-300">
                      <h3 className="font-bold text-foreground line-clamp-2 leading-tight mb-2">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {article.summary || "Click to read full article..."}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Right Arrow */}
            <button 
              onClick={scrollRight}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur hover:bg-[#BFF549] hover:text-black text-white p-3 rounded-full border border-white/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-3xl px-6 text-center lg:px-0">
          <div className="backdrop-blur-md bg-black/40 border border-white/5 p-8 rounded-3xl flex flex-col items-center">
            <p className="mb-8 font-medium text-lg text-white leading-relaxed md:text-xl">
              "The rapid synthesis provided by B.L.A.S.T. has completely changed how our team processes the daily influx of new AI tools and breakthroughs."
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border">
                <Image
                  alt="System Pilot"
                  className="h-full w-full object-cover grayscale"
                  fill
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">
                  Antigravity Pilot
                </p>
                <p className="text-neutral-400 text-sm">
                  AI Architect · B.L.A.S.T. Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
