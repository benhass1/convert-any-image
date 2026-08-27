/**
 * Signal Utility design reminder: direct routes, strong navigation escape routes, no dead ends.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useLayoutEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Compress from "./pages/Compress";
import FormatToolPage from "./pages/FormatToolPage";

const NotFound = lazy(() => import("./pages/NotFound"));
const RemoveExif = lazy(() => import("./pages/RemoveExif"));
const BlogIndex = lazy(() => import("./pages/Blog").then(({ BlogIndex }) => ({ default: BlogIndex })));
const BlogArticle = lazy(() => import("./pages/Blog").then(({ BlogArticle }) => ({ default: BlogArticle })));
const About = lazy(() => import("./pages/InfoPages").then(({ About }) => ({ default: About })));
const Legal = lazy(() => import("./pages/InfoPages").then(({ Legal }) => ({ default: Legal })));

function ScrollManager() { const [location] = useLocation(); useLayoutEffect(() => { const priorScrollRestoration = window.history.scrollRestoration; let frame = 0; let attempts = 0; window.history.scrollRestoration = "manual"; const scrollToRouteTarget = () => { window.cancelAnimationFrame(frame); const hash = window.location.hash.slice(1); const normalizedLocation = location.replace(/\/+$/, "") || "/"; const defaultTarget = normalizedLocation === "/" ? "converter-upload" : normalizedLocation === "/compress" ? "compress-upload" : null; const targetId = hash || defaultTarget; const target = targetId ? document.getElementById(targetId) ?? (targetId === "compress-upload" ? document.querySelector('[aria-label="Visual quality"]')?.closest("section") : null) : null; if (target) { const top = target.getBoundingClientRect().top + window.scrollY - 92; window.scrollTo({ top, left: 0, behavior: "auto" }); return; } if (targetId && attempts < 3) { attempts += 1; frame = window.requestAnimationFrame(scrollToRouteTarget); return; } window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }; scrollToRouteTarget(); const onHashChange = () => { attempts = 0; scrollToRouteTarget(); }; window.addEventListener("hashchange", onHashChange); return () => { window.cancelAnimationFrame(frame); window.removeEventListener("hashchange", onHashChange); window.history.scrollRestoration = priorScrollRestoration; }; }, [location]); return null; }
function LoadingPage() { return <main className="grid min-h-screen place-items-center bg-[#f7f4ee] px-5 text-center" aria-label="Loading page"><div><span className="mx-auto grid h-12 w-12 place-items-center border border-[#132432] bg-[#b7f840] text-xs font-bold text-[#132432]">CAI</span><p className="label mt-5">PREPARING YOUR PAGE</p><p className="mt-2 text-sm text-[#52616a]">Loading the guide workspace.</p></div></main>; }
function Router() { return <Suspense fallback={<LoadingPage/>}><ScrollManager/><Switch><Route path="/" component={Home} /><Route path="/heic-to-jpg">{() => <FormatToolPage variant="heic"/>}</Route><Route path="/webp-to-png">{() => <FormatToolPage variant="webp"/>}</Route><Route path="/compress" component={Compress}/><Route path="/remove-exif" component={RemoveExif}/><Route path="/blog" component={BlogIndex}/><Route path="/blog/:slug" component={BlogArticle}/><Route path="/about" component={About}/><Route path="/privacy">{() => <Legal kind="privacy"/>}</Route><Route path="/terms">{() => <Legal kind="terms"/>}</Route><Route path="/cookie-policy">{() => <Legal kind="cookies"/>}</Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Suspense>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
