import { Check, ChevronRight, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import UploadBox from "../components/UploadBox";
import Loader from "../components/Loader";
import useGeoLocation from "../hooks/useGeoLocation";
import { categories } from "../utils/dummyData";
import { useIssues } from "../context/IssuesContext";
import { useToast } from "../context/ToastContext";

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function ReportIssue() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    imageFile: null,
    imagePreview: "",
    title: "",
    description: "",
    category: "",
    locationLabel: "",
    coordinates: null,
  });
  const [errors, setErrors] = useState({});

  const { coords, loading: geoLoading, detectLocation } = useGeoLocation();
  const { submitIssue, submitting } = useIssues();
  const { showToast } = useToast();

  const stepLabels = ["Upload image", "Describe issue", "Confirm location"];

  const aiSuggestion = useMemo(() => {
    if (!form.description) return "AI suggestion will appear based on your description";
    if (form.description.toLowerCase().includes("light")) return "Suggested category: Streetlight";
    if (form.description.toLowerCase().includes("garbage")) return "Suggested category: Sanitation";
    return "Suggested category: Roads";
  }, [form.description]);

  const validateStep = (current) => {
    const nextErrors = {};
    if (current === 1 && !form.imageFile) nextErrors.imageFile = "Please upload an issue image.";
    if (current === 2) {
      if (!form.title.trim()) nextErrors.title = "Title is required.";
      if (!form.description.trim()) nextErrors.description = "Description is required.";
      if (!form.category) nextErrors.category = "Select a category.";
    }
    if (current === 3) {
      if (!form.locationLabel.trim()) nextErrors.locationLabel = "Location is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const canSubmit = form.imageFile && form.title.trim() && form.description.trim() && form.category && form.locationLabel.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(3) || !canSubmit) return;
    try {
      const issue = await submitIssue(form);
      showToast(`Issue submitted successfully. ID: ${issue.id}`, "success");
      setStep(1);
      setForm({
        imageFile: null,
        imagePreview: "",
        title: "",
        description: "",
        category: "",
        locationLabel: "",
        coordinates: null,
      });
    } catch (err) {
      showToast(err.message || "Issue submission failed", "error");
    }
  };

  const onFileChange = async (file) => {
    try {
      const preview = await toDataUrl(file);
      setForm((prev) => ({ ...prev, imageFile: file, imagePreview: preview }));
      setErrors((prev) => ({ ...prev, imageFile: "" }));
    } catch (error) {
      showToast(error.message || "Unable to process selected image", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Report Civic Issue</h1>
        <p className="mt-1 text-sm text-slate-600">3-step guided reporting flow with quality checks for faster action.</p>
      </header>

      <div className="panel p-4">
        <p className="text-sm font-semibold text-slate-700">
          Step {step}/3 - {stepLabels[step - 1]}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 rounded-full ${item <= step ? "bg-primary" : "bg-slate-200"} transition-all duration-300`}
            />
          ))}
        </div>
      </div>

      <form className="panel space-y-5 p-4 sm:p-6" onSubmit={handleSubmit}>
        {step === 1 && <UploadBox preview={form.imagePreview} onFileChange={onFileChange} error={errors.imageFile} />}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
                Issue title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className={`w-full rounded-soft border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${errors.title ? "border-red-400" : ""}`}
                placeholder="Ex: Water leakage near bus stand"
              />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className={`w-full rounded-soft border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${errors.description ? "border-red-400" : ""}`}
                placeholder="Describe what happened and impact on citizens."
              />
              {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description}</p> : null}
            </div>

            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className={`w-full rounded-soft border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${errors.category ? "border-red-400" : ""}`}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-blue-700">{aiSuggestion}</p>
              {errors.category ? <p className="mt-1 text-xs text-red-600">{errors.category}</p> : null}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="panel border-dashed p-4">
              <p className="mb-2 text-sm font-medium">Location detection</p>
              <button
                type="button"
                onClick={detectLocation}
                className="btn-secondary text-xs"
              >
                {geoLoading ? <Loader text="Detecting..." /> : "Auto-detect my location"}
              </button>
              {coords ? (
                <p className="mt-2 text-xs text-slate-600">
                  Latitude: {coords.latitude.toFixed(4)}, Longitude: {coords.longitude.toFixed(4)}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="locationLabel" className="mb-1 block text-sm font-medium text-slate-700">
                Locality / landmark
              </label>
              <input
                id="locationLabel"
                value={form.locationLabel}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    locationLabel: event.target.value,
                    coordinates: coords,
                  }))
                }
                className={`w-full rounded-soft border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${errors.locationLabel ? "border-red-400" : ""}`}
                placeholder="Ex: Gate 2, City Hospital, Pune"
              />
              {errors.locationLabel ? <p className="mt-1 text-xs text-red-600">{errors.locationLabel}</p> : null}
            </div>

            <div className="h-44 rounded-soft border border-dashed border-slate-300 bg-gradient-to-r from-slate-100 to-blue-50 p-4">
              <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" /> Map placeholder preview
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button type="button" className="btn-secondary" onClick={goBack} disabled={step === 1}>
            Back
          </button>
          {step < 3 ? (
            <button type="button" className="btn-primary" onClick={goNext}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader text="Submitting..." />
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Submit Issue <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReportIssue;
