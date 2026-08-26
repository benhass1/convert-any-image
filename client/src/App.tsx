/**
 * Signal Utility design reminder: direct routes, strong navigation escape routes, no dead ends.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Compress from "./pages/Compress";
import { BlogArticle, BlogIndex } from "./pages/Blog";
import { About, Legal } from "./pages/InfoPages";

function Router() { return <Switch><Route path="/" component={Home} /><Route path="/compress" component={Compress}/><Route path="/blog" component={BlogIndex}/><Route path="/blog/:slug" component={BlogArticle}/><Route path="/about" component={About}/><Route path="/privacy">{() => <Legal kind="privacy"/>}</Route><Route path="/terms">{() => <Legal kind="terms"/>}</Route><Route path="/cookie-policy">{() => <Legal kind="cookies"/>}</Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
