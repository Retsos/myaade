import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Save, ArrowLeft } from "lucide-react";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAppStore } from "../store/useAppStore";

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const addCustomerToStore = useAppStore((s) => s.addCustomer);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    vat_number: "",
    country: "GR",
    city: "",
    postal_code: "",
    street: "",
    street_number: "",
    email: "",
    phone: "",
    doy_name: "",
    activity: "",
    branch: "0",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name || !form.vat_number) {
      setToast({
        type: "error",
        message: "Τα πεδία Επωνυμία και ΑΦΜ είναι υποχρεωτικά.",
      });
      return;
    }

    setLoading(true);
    try {
      await addCustomerToStore({ ...form, branch: parseInt(form.branch) || 0 });
      setToast({
        type: "success",
        message: "Ο πελάτης καταχωρήθηκε επιτυχώς!",
      });
      setTimeout(() => {
        navigate("/customers");
      }, 1500);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "Αποτυχία καταχώρησης πελάτη.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customers")}
          aria-label="Πίσω"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-500" />
            Νέος Πελάτης
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Καταχωρήστε τα στοιχεία του νέου πελάτη
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-850 border border-slate-800 rounded-xl p-6 md:p-8 space-y-8 shadow-sm"
      >
        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
            Βασικά Στοιχεία
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Επωνυμία / Ονοματεπώνυμο *"
                value={form.display_name}
                onChange={set("display_name")}
                placeholder="π.χ. Παπαδόπουλος Ιωάννης"
                required
              />
            </div>
            <Input
              label="Α.Φ.Μ. *"
              value={form.vat_number}
              onChange={set("vat_number")}
              placeholder="π.χ. 123456789"
              className="font-mono"
              required
            />
            <Input
              label="Δ.Ο.Υ."
              value={form.doy_name}
              onChange={set("doy_name")}
              placeholder="π.χ. Α' Αθηνών"
            />
            <div className="md:col-span-2">
              <Input
                label="Δραστηριότητα / Επάγγελμα"
                value={form.activity}
                onChange={set("activity")}
                placeholder="π.χ. Εμπόριο Η/Υ"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
            Διεύθυνση Έδρας
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="col-span-2">
                <Input
                  label="Οδός"
                  value={form.street}
                  onChange={set("street")}
                  placeholder="π.χ. Ερμού"
                />
              </div>
              <Input
                label="Αριθμός"
                value={form.street_number}
                onChange={set("street_number")}
                placeholder="π.χ. 12"
              />
            </div>
            <Input
              label="Πόλη / Περιοχή"
              value={form.city}
              onChange={set("city")}
              placeholder="π.χ. Αθήνα"
            />
            <Input
              label="Τ.Κ."
              value={form.postal_code}
              onChange={set("postal_code")}
              placeholder="π.χ. 10563"
              className="font-mono"
            />
            <Input
              label="Χώρα"
              value={form.country}
              onChange={set("country")}
              placeholder="π.χ. GR"
            />
            <Input
              label="Αριθμός Εγκατάστασης (Υποκατάστημα)"
              type="number"
              value={form.branch}
              onChange={set("branch")}
              placeholder="0 για κεντρικό"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
            Στοιχεία Επικοινωνίας
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="π.χ. info@example.com"
            />
            <Input
              label="Τηλέφωνο"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="π.χ. 2101234567"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/customers")}
          >
            Ακύρωση
          </Button>
          <Button
            type="submit"
            loading={loading}
            iconLeft={!loading && <Save className="w-4 h-4" />}
          >
            {loading ? "Αποθήκευση..." : "Αποθήκευση Πελάτη"}
          </Button>
        </div>
      </form>
    </div>
  );
}
