function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} CCIRS. Public Service Reporting Interface.</p>
        <p>Built for smart-city civic response workflows.</p>
      </div>
    </footer>
  );
}

export default Footer;
