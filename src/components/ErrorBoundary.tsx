import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0908] text-[#F5F1E8] flex items-center justify-center px-5">
          <div className="max-w-md text-center">
            <h1 className="font-display uppercase text-3xl mb-3">Errore caricamento</h1>
            <p className="text-sm opacity-70 mb-5">
              La pagina non è riuscita a caricarsi. Ricarica o torna alla home.
            </p>
            <a
              href="/"
              className="inline-block rounded-full bg-[#E8DCC8] text-[#0A0908] px-5 py-2.5 text-xs uppercase tracking-widest"
            >
              Torna alla home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}