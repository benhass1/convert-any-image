/**
 * Signal Utility design reminder: direct routes, strong navigation escape routes, no dead ends.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLayoutEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Compress from "./pages/Compress";
import { BlogArticle, BlogIndex } from "./pages/Blog";
import { About, Legal } from "./pages/InfoPages";

function ScrollManager() { const [location] = useLocation(); useLayoutEffect(() => { const hash = window.location.hash.slice(1); const target = document.getElementById(hash) ?? (hash === "compress-upload" ? document.querySelector('[aria-label="Visual quality"]')?.closest("section") : null); if (target) { const top = target.getBoundingClientRect().top + window.scrollY - 92; window.scrollTo({ top, left: 0, behavior: "auto" }); return; } window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [location]); return null; }
function Router() { return <><ScrollManager/><Switch><Route path="/" component={Home} /><Route path="/compress" component={Compress}/><Route path="/blog" component={BlogIndex}/><Route path="/blog/:slug" component={BlogArticle}/><Route path="/about" component={About}/><Route path="/privacy">{() => <Legal kind="privacy"/>}</Route><Route path="/terms">{() => <Legal kind="terms"/>}</Route><Route path="/cookie-policy">{() => <Legal kind="cookies"/>}</Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
