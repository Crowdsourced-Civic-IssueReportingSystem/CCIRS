function Loader({ text = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {text}
    </div>
  );
}

export default Loader;
