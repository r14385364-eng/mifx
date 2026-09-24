import {
  Check,
  CreditCard,
  Copy,
  Edit2,
  Eye,
  Headphones,
  Info,
  Landmark,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface PaymentSourceItem {
  id: string;
  label: string;
  category: "Bank" | "E-Wallet";
  active: boolean;
}

export interface ContactPersonItem {
  id: string;
  name: string;
  role: string;
  whatsappLabel?: string;
  whatsappNumber: string;
  email?: string;
  active: boolean;
}

const defaultPaymentSources: PaymentSourceItem[] = [
  { id: "bca", label: "Bank BCA", category: "Bank", active: true },
  { id: "mandiri", label: "Bank Mandiri", category: "Bank", active: true },
  { id: "bri", label: "Bank BRI", category: "Bank", active: true },
  { id: "bni", label: "Bank BNI", category: "Bank", active: true },
  { id: "cimb", label: "Bank CIMB Niaga", category: "Bank", active: true },
  { id: "permata", label: "Bank Permata", category: "Bank", active: true },
  { id: "gopay", label: "GoPay", category: "E-Wallet", active: true },
  { id: "ovo", label: "OVO", category: "E-Wallet", active: true },
  { id: "dana", label: "DANA", category: "E-Wallet", active: true },
  { id: "shopeepay", label: "ShopeePay", category: "E-Wallet", active: true },
];

const defaultContactPersons: ContactPersonItem[] = [
  {
    id: "contact_aksay",
    name: "AKSAY",
    role: "Gotrade Dedicated Account Support",
    whatsappLabel: "Whatsapp",
    whatsappNumber: "082329157278",
    email: "support@gotrade.com",
    active: true,
  },
];

function formatWaUrl(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "https://wa.me/6282329157278";
  if (cleaned.startsWith("62")) return `https://wa.me/${cleaned}`;
  if (cleaned.startsWith("0")) return `https://wa.me/62${cleaned.slice(1)}`;
  return `https://wa.me/${cleaned}`;
}

export function SettingsAdminPage() {
  // Deposit target account states
  const [bankName, setBankName] = useState<string>("Keb Hana Bank");
  const [accountNumber, setAccountNumber] = useState<string>("11628950560");
  const [accountName, setAccountName] = useState<string>("AKSAY S.PUTRA");
  const [initialProfitPct, setInitialProfitPct] = useState<string>("10");
  const [paymentSources, setPaymentSources] = useState<PaymentSourceItem[]>(defaultPaymentSources);

  // Contact Persons state (AKSAY Dedicated Support)
  const [contactPersons, setContactPersons] = useState<ContactPersonItem[]>(defaultContactPersons);
  const [contactSearch, setContactSearch] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);

  // Search & Filter state for payment sources CRUD
  const [sourceSearch, setSourceSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "Bank" | "E-Wallet">("ALL");

  // Modal State for Add / Edit Source
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [editingSourceItem, setEditingSourceItem] = useState<PaymentSourceItem | null>(null);
  const [formSourceLabel, setFormSourceLabel] = useState<string>("");
  const [formSourceCategory, setFormSourceCategory] = useState<"Bank" | "E-Wallet">("Bank");
  const [formSourceActive, setFormSourceActive] = useState<boolean>(true);

  // Modal State for Add / Edit Contact Person
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [editingContactItem, setEditingContactItem] = useState<ContactPersonItem | null>(null);
  const [formContactName, setFormContactName] = useState<string>("");
  const [formContactRole, setFormContactRole] = useState<string>("");
  const [formContactWaLabel, setFormContactWaLabel] = useState<string>("Whatsapp");
  const [formContactWaNumber, setFormContactWaNumber] = useState<string>("");
  const [formContactEmail, setFormContactEmail] = useState<string>("");
  const [formContactActive, setFormContactActive] = useState<boolean>(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await secureFetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          if (data.settings.deposit_bank_name) setBankName(data.settings.deposit_bank_name);
          if (data.settings.deposit_account_number)
            setAccountNumber(data.settings.deposit_account_number);
          if (data.settings.deposit_account_name)
            setAccountName(data.settings.deposit_account_name);
          if (data.settings.initial_profit_percentage)
            setInitialProfitPct(data.settings.initial_profit_percentage);

          if (data.settings.deposit_payment_sources) {
            try {
              const parsed = JSON.parse(data.settings.deposit_payment_sources);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPaymentSources(parsed);
              }
            } catch {
              // fallback to defaults
            }
          }

          if (data.settings.contact_persons_list) {
            try {
              const parsedContacts = JSON.parse(data.settings.contact_persons_list);
              if (Array.isArray(parsedContacts) && parsedContacts.length > 0) {
                setContactPersons(parsedContacts);
              }
            } catch {
              // fallback
            }
          } else if (data.settings.contact_person_name) {
            setContactPersons([
              {
                id: "contact_aksay",
                name: data.settings.contact_person_name,
                role: data.settings.contact_person_role || "Gotrade Dedicated Account Support",
                whatsappLabel: data.settings.contact_person_wa_label || "Whatsapp",
                whatsappNumber: data.settings.contact_person_phone || "082329157278",
                email: data.settings.contact_person_email || "support@gotrade.com",
                active: true,
              },
            ]);
          }
        }
      } catch {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const persistSettings = async (
    customSources?: PaymentSourceItem[],
    customBankName?: string,
    customAccountNum?: string,
    customAccountName?: string,
    customContacts?: ContactPersonItem[],
  ) => {
    const bName = (customBankName ?? bankName).trim();
    const aNum = (customAccountNum ?? accountNumber).trim();
    const aName = (customAccountName ?? accountName).trim();
    const sourcesToSave = customSources ?? paymentSources;
    const contactsToSave = customContacts ?? contactPersons;

    if (!bName || !aNum || !aName) {
      toast.error("Mohon lengkapi seluruh data nama bank, nomor rekening, dan atas nama.");
      return false;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        deposit_bank_name: bName,
        deposit_account_number: aNum,
        deposit_account_name: aName,
        initial_profit_percentage: initialProfitPct,
        deposit_payment_sources: JSON.stringify(sourcesToSave),
        contact_persons_list: JSON.stringify(contactsToSave),
        contact_person_name: contactsToSave[0]?.name || "AKSAY",
        contact_person_role: contactsToSave[0]?.role || "Gotrade Dedicated Account Support",
        contact_person_phone: contactsToSave[0]?.whatsappNumber || "082329157278",
        contact_person_wa_label: contactsToSave[0]?.whatsappLabel || "Whatsapp",
        contact_person_email: contactsToSave[0]?.email || "support@gotrade.com",
      };

      const res = await secureFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return true;
      } else {
        toast.error("Gagal menyimpan pengaturan.");
        return false;
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    const success = await persistSettings();
    if (success) {
      toast.success("Seluruh pengaturan berhasil disimpan ke Database!", {
        description:
          "Rekening tujuan deposit & profil contact person AKSAY telah ter-update di seluruh sistem.",
      });
    }
  };

  // Payment Sources CRUD Handlers
  const openAddSourceModal = () => {
    setEditingSourceItem(null);
    setFormSourceLabel("");
    setFormSourceCategory("Bank");
    setFormSourceActive(true);
    setIsSourceModalOpen(true);
  };

  const openEditSourceModal = (item: PaymentSourceItem) => {
    setEditingSourceItem(item);
    setFormSourceLabel(item.label);
    setFormSourceCategory(item.category);
    setFormSourceActive(item.active !== false);
    setIsSourceModalOpen(true);
  };

  const handleSaveSourceModal = async () => {
    if (!formSourceLabel.trim()) {
      toast.error("Nama sumber dana wajib diisi.");
      return;
    }

    let updatedSources: PaymentSourceItem[];
    if (editingSourceItem) {
      updatedSources = paymentSources.map((item) =>
        item.id === editingSourceItem.id
          ? {
              ...item,
              label: formSourceLabel.trim(),
              category: formSourceCategory,
              active: formSourceActive,
            }
          : item,
      );
      toast.success(`"${formSourceLabel.trim()}" berhasil diperbarui`);
    } else {
      const generatedId =
        formSourceLabel
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 15) + `_${Date.now().toString().slice(-4)}`;
      const newItem: PaymentSourceItem = {
        id: generatedId,
        label: formSourceLabel.trim(),
        category: formSourceCategory,
        active: formSourceActive,
      };
      updatedSources = [...paymentSources, newItem];
      toast.success(`"${formSourceLabel.trim()}" berhasil ditambahkan`);
    }

    setPaymentSources(updatedSources);
    setIsSourceModalOpen(false);
    void persistSettings(updatedSources);
  };

  const handleDeleteSource = (item: PaymentSourceItem) => {
    const updated = paymentSources.filter((s) => s.id !== item.id);
    setPaymentSources(updated);
    toast.success(`"${item.label}" telah dihapus.`);
    void persistSettings(updated);
  };

  const handleToggleSourceActive = (item: PaymentSourceItem) => {
    const updated = paymentSources.map((s) => (s.id === item.id ? { ...s, active: !s.active } : s));
    setPaymentSources(updated);
    toast.info(`Status "${item.label}" diubah menjadi ${!item.active ? "Aktif" : "Nonaktif"}.`);
    void persistSettings(updated);
  };

  const handleResetSourcesDefault = async () => {
    if (
      confirm("Kembalikan daftar sumber dana ke pilihan bank & e-wallet standar default Gotrade?")
    ) {
      setPaymentSources(defaultPaymentSources);
      await persistSettings(defaultPaymentSources);
      toast.success("Daftar sumber dana telah di-reset ke standar default.");
    }
  };

  // Contact Persons CRUD Handlers (AKSAY / Support Gotrade)
  const openAddContactModal = () => {
    setEditingContactItem(null);
    setFormContactName("");
    setFormContactRole("Gotrade Dedicated Account Support");
    setFormContactWaLabel("Whatsapp");
    setFormContactWaNumber("082329157278");
    setFormContactEmail("support@gotrade.com");
    setFormContactActive(true);
    setIsContactModalOpen(true);
  };

  const openEditContactModal = (item: ContactPersonItem) => {
    setEditingContactItem(item);
    setFormContactName(item.name);
    setFormContactRole(item.role);
    setFormContactWaLabel(item.whatsappLabel || "Whatsapp");
    setFormContactWaNumber(item.whatsappNumber);
    setFormContactEmail(item.email || "");
    setFormContactActive(item.active !== false);
    setIsContactModalOpen(true);
  };

  const handleSaveContactModal = async () => {
    if (!formContactName.trim()) {
      toast.error("Nama Contact Person wajib diisi.");
      return;
    }
    if (!formContactWaNumber.trim()) {
      toast.error("Nomor WhatsApp wajib diisi.");
      return;
    }

    let updatedContacts: ContactPersonItem[];
    if (editingContactItem) {
      updatedContacts = contactPersons.map((c) =>
        c.id === editingContactItem.id
          ? {
              ...c,
              name: formContactName.trim(),
              role: formContactRole.trim(),
              whatsappLabel: formContactWaLabel.trim() || "Whatsapp",
              whatsappNumber: formContactWaNumber.trim(),
              email: formContactEmail.trim(),
              active: formContactActive,
            }
          : c,
      );
      toast.success(`Contact person "${formContactName.trim()}" berhasil diperbarui`);
    } else {
      const generatedId = `contact_${Date.now().toString().slice(-6)}`;
      const newContact: ContactPersonItem = {
        id: generatedId,
        name: formContactName.trim(),
        role: formContactRole.trim() || "Gotrade Dedicated Account Support",
        whatsappLabel: formContactWaLabel.trim() || "Whatsapp",
        whatsappNumber: formContactWaNumber.trim(),
        email: formContactEmail.trim(),
        active: formContactActive,
      };
      updatedContacts = [...contactPersons, newContact];
      toast.success(`Contact person "${formContactName.trim()}" berhasil ditambahkan`);
    }

    setContactPersons(updatedContacts);
    setIsContactModalOpen(false);
    void persistSettings(undefined, undefined, undefined, undefined, updatedContacts);
  };

  const handleDeleteContact = (item: ContactPersonItem) => {
    if (contactPersons.length <= 1) {
      if (
        !confirm(
          `Apakah Anda yakin ingin menghapus "${item.name}"? Halaman /lainnya tidak akan memiliki contact person jika dihapus.`,
        )
      ) {
        return;
      }
    }
    const updated = contactPersons.filter((c) => c.id !== item.id);
    setContactPersons(updated);
    toast.success(`Contact person "${item.name}" telah dihapus.`);
    void persistSettings(undefined, undefined, undefined, undefined, updated);
  };

  const handleToggleContactActive = (item: ContactPersonItem) => {
    const updated = contactPersons.map((c) => (c.id === item.id ? { ...c, active: !c.active } : c));
    setContactPersons(updated);
    toast.info(`Status "${item.name}" diubah menjadi ${!item.active ? "Aktif" : "Nonaktif"}.`);
    void persistSettings(undefined, undefined, undefined, undefined, updated);
  };

  const handleResetContactsDefault = async () => {
    if (confirm("Kembalikan contact person ke profil default AKSAY (082329157278)?")) {
      setContactPersons(defaultContactPersons);
      await persistSettings(undefined, undefined, undefined, undefined, defaultContactPersons);
      toast.success("Contact person telah di-reset ke profil default AKSAY.");
    }
  };

  const handleCopyPreviewBank = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(accountNumber).catch(() => {});
    }
    setCopiedBank(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Filtered payment sources for table
  const filteredSources = paymentSources.filter((s) => {
    const matchesCategory = categoryFilter === "ALL" || s.category === categoryFilter;
    const matchesSearch = s.label.toLowerCase().includes(sourceSearch.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const activeBanks = paymentSources.filter((s) => s.category === "Bank" && s.active !== false);
  const activeEWallets = paymentSources.filter(
    (s) => s.category === "E-Wallet" && s.active !== false,
  );

  // Filtered contact persons
  const filteredContacts = contactPersons.filter((c) => {
    const search = contactSearch.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(search) ||
      c.role.toLowerCase().includes(search) ||
      c.whatsappNumber.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search))
    );
  });

  const activeContacts = contactPersons.filter((c) => c.active !== false);

  return (
    <AdminLayout
      title="Pengaturan Sistem"
      subtitle="Kelola rekening bank tujuan deposit, sumber dana, dan profil contact person support AKSAY"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <Landmark className="mr-1.5 h-3.5 w-3.5" /> Konfigurasi Rekening & Support Platform
            </Badge>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Controls (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* 1. Contact Person Gotrade Anda (AKSAY Support CRUD) */}
            <Card className="border-emerald-500/30 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Headphones className="h-4 w-4" />
                      </div>
                      Contact Person Gotrade Anda (Halaman /lainnya)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Kelola profil support dedikasi (Nama: AKSAY, Jabatan, Nomor WhatsApp, Email)
                      yang tampil pada kartu Contact Person di halaman <strong>/lainnya</strong>.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetContactsDefault}
                      title="Reset ke profil default AKSAY"
                      className="h-8 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={openAddContactModal}
                      className="h-8 gap-1 bg-[#00a651] text-xs text-white hover:bg-[#00a651]/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Contact
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Cari nama contact person, role, atau nomor WhatsApp..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {/* List Contacts Table / Cards */}
                <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
                  {filteredContacts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Tidak ada contact person yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center justify-between p-3 text-xs transition-colors hover:bg-muted/30 ${
                          !contact.active ? "bg-muted/10 opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#00a651]/30 bg-[#e6f7ef] text-[#00a651] shadow-2xs">
                            <Headphones className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold tracking-wide text-foreground">
                                {contact.name}
                              </span>
                              <Badge
                                variant={contact.active ? "default" : "secondary"}
                                className={`text-[9px] px-1.5 py-0 ${
                                  contact.active
                                    ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"
                                    : ""
                                }`}
                              >
                                {contact.active ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{contact.role}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                <Phone className="h-3 w-3" />
                                {contact.whatsappLabel || "Whatsapp"}: {contact.whatsappNumber}
                              </span>
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {contact.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Active Switch */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {contact.active ? "Aktif" : "Nonaktif"}
                            </span>
                            <Switch
                              checked={contact.active}
                              onCheckedChange={() => handleToggleContactActive(contact)}
                              className="scale-75"
                            />
                          </div>

                          {/* Edit Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditContactModal(contact)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Contact Person"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteContact(contact)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Hapus Contact Person"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Perubahan pada nama (contoh: <strong>AKSAY</strong>), role/jabatan, atau nomor
                  WhatsApp akan langsung muncul di halaman <strong>/lainnya</strong> trader.
                </p>
              </CardContent>
            </Card>

            {/* 2. Rekening Tujuan Deposit Gotrade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Rekening Bank Tujuan Deposit Gotrade
                </CardTitle>
                <CardDescription>
                  Atur nomor rekening, nama bank, dan atas nama resmi yang ditampilkan pada halaman
                  /deposit untuk menerima transfer dana dari trader.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nama Bank */}
                <div className="space-y-1.5">
                  <Label htmlFor="bank-name" className="text-xs font-semibold">
                    Nama Bank Tujuan
                  </Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: Keb Hana Bank"
                    className="font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama bank yang akan ditampilkan pada kartu rekening trader.
                  </p>
                </div>

                {/* Nomor Rekening */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-number" className="text-xs font-semibold">
                    Nomor Rekening
                  </Label>
                  <Input
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 11628950560"
                    className="font-mono font-bold tracking-wider"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nomor rekening yang dapat disalin satu klik oleh trader.
                  </p>
                </div>

                {/* Atas Nama Rekening */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-name" className="text-xs font-semibold">
                    Atas Nama Rekening
                  </Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: AKSAY S.PUTRA"
                    className="font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama pemilik rekening resmi tujuan transfer (Contoh: AKSAY S.PUTRA).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. CRUD Rekening / E-Wallet Sumber Dana */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Wallet className="h-5 w-5 text-primary" />
                      Kelola Rekening / E-Wallet Sumber Dana (CRUD)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tambah, ubah, aktifkan, atau hapus pilihan bank & e-wallet yang dapat dipilih
                      trader saat deposit.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetSourcesDefault}
                      title="Reset ke pilihan default standar"
                      className="h-8 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={openAddSourceModal}
                      className="h-8 gap-1 bg-primary text-xs text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Sumber Dana
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search & Filter bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Cari bank atau e-wallet..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("ALL")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "ALL"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Semua ({paymentSources.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("Bank")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "Bank"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Bank ({paymentSources.filter((p) => p.category === "Bank").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("E-Wallet")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "E-Wallet"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      E-Wallet ({paymentSources.filter((p) => p.category === "E-Wallet").length})
                    </button>
                  </div>
                </div>

                {/* List Table */}
                <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
                  {filteredSources.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada rekening atau e-wallet yang cocok.
                    </div>
                  ) : (
                    filteredSources.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/30 ${
                          !item.active ? "bg-muted/10 opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md ${
                              item.category === "Bank"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {item.category === "Bank" ? (
                              <Landmark className="h-3.5 w-3.5" />
                            ) : (
                              <Smartphone className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.label}</p>
                            <span
                              className={`inline-block text-[10px] font-medium ${
                                item.category === "Bank"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {item.active !== false ? "Aktif" : "Nonaktif"}
                            </span>
                            <Switch
                              checked={item.active !== false}
                              onCheckedChange={() => handleToggleSourceActive(item)}
                              className="scale-75"
                            />
                          </div>

                          {/* Edit Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditSourceModal(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit sumber dana"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteSource(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Hapus sumber dana"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Hanya sumber dana berstatus <strong>Aktif</strong> yang akan muncul di dropdown
                  pengguna pada saat mengajukan deposit.
                </p>
              </CardContent>
            </Card>

            {/* 4. Profit Mechanism Settings Card */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    %
                  </span>
                  Pengaturan Persentase Profit Trading
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Atur persentase profit awal yang diberikan otomatis saat deposit trader disetujui.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="initial-profit-pct" className="text-xs font-semibold">
                    Persentase Profit Awal saat Deposit Disetujui (%)
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      id="initial-profit-pct"
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={initialProfitPct}
                      onChange={(e) => setInitialProfitPct(e.target.value)}
                      placeholder="Contoh: 10"
                      className="font-bold"
                    />
                    <span className="absolute right-3 text-xs font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Contoh: Jika diset <strong className="text-foreground">10%</strong>, saat user
                    deposit Rp 10 Juta dan disetujui admin, user otomatis mendapat nominal basis
                    profit{" "}
                    <strong className="text-amber-600 dark:text-amber-400">Rp 1.000.000</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Mobile Preview (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Live Preview: Contact Person Gotrade Anda (/lainnya) */}
            <Card className="border-emerald-500/30 bg-muted/10 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Live Preview
                    /lainnya
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-[10px] text-emerald-600"
                  >
                    Contact Person
                  </Badge>
                </div>
                <CardDescription>
                  Pratinjau kartu kontak support yang dilihat trader pada halaman /lainnya secara
                  real time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mx-auto max-w-xs space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="px-1 text-xs font-bold text-gray-700 dark:text-gray-200">
                    Contact Person Gotrade Anda
                  </p>

                  {activeContacts.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 text-center text-xs text-gray-500 dark:bg-card">
                      Tidak ada contact person yang aktif.
                    </div>
                  ) : (
                    activeContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-2xs dark:border-border dark:bg-card"
                      >
                        {/* Header Contact */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00a651]/20 bg-[#e6f7ef] text-[#00a651]">
                            <Headphones className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-extrabold tracking-wide text-gray-900 dark:text-gray-100">
                              {contact.name || "AKSAY"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {contact.role || "Gotrade Dedicated Account Support"}
                            </span>
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3 dark:border-border">
                          {contact.whatsappNumber && (
                            <a
                              href={formatWaUrl(contact.whatsappNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
                            >
                              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                                  {contact.whatsappLabel || "Whatsapp"}
                                </span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  {contact.whatsappNumber}
                                </span>
                              </div>
                            </a>
                          )}

                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
                            >
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                                  Email
                                </span>
                                <span className="text-xs font-medium text-gray-500">
                                  {contact.email}
                                </span>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Preview: Rekening Tujuan Deposit (/deposit) */}
            <Card className="border-primary/20 bg-muted/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Eye className="h-4 w-4 text-primary" /> Live Preview /deposit
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Rekening Tujuan
                  </Badge>
                </div>
                <CardDescription>
                  Pratinjau tampilan kartu rekening & sumber dana di halaman /deposit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mx-auto max-w-xs space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
                  {/* Preview Kartu Rekening Tujuan */}
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Rekening Tujuan</p>
                          <p className="text-[10px] text-muted-foreground">Transfer Bank</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                        Resmi
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Nama Bank</p>
                        <p className="mt-0.5 text-sm font-extrabold tracking-wide text-foreground">
                          {bankName || "Keb Hana Bank"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Nomor Rekening
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                          <span className="font-mono text-xs font-extrabold tracking-wider text-foreground">
                            {accountNumber || "11628950560"}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPreviewBank}
                            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            {copiedBank ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedBank ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Atas Nama</p>
                        <p className="mt-0.5 text-xs font-bold text-foreground">
                          {accountName || "AKSAY S.PUTRA"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Transfer dana hanya ke rekening resmi di atas
                    </p>
                  </div>

                  {/* Preview Pilihan Sumber Dana */}
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold text-foreground">
                      Sumber Dana Tersedia ({activeBanks.length + activeEWallets.length}):
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activeBanks.slice(0, 4).map((b) => (
                        <span
                          key={b.id}
                          className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-600"
                        >
                          {b.label}
                        </span>
                      ))}
                      {activeEWallets.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600"
                        >
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Helper */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Bantuan Pengaturan</p>
                    <p>
                      Semua perubahan Contact Person AKSAY dan Rekening Tujuan Bank langsung aktif
                      di sisi trader tanpa perlu refresh browser atau restart server.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Contact Person (AKSAY) */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-emerald-600" />
              {editingContactItem ? "Edit Contact Person Support" : "Tambah Contact Person Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingContactItem
                ? "Perbarui nama, jabatan, nomor WhatsApp, email, dan status aktif kontak support ini."
                : "Tambahkan profil kontak support yang akan tampil di halaman /lainnya trader."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-semibold">
                Nama Lengkap / Panggilan
              </Label>
              <Input
                id="contact-name"
                value={formContactName}
                onChange={(e) => setFormContactName(e.target.value)}
                placeholder="Contoh: AKSAY"
                className="font-bold tracking-wide"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-role" className="text-xs font-semibold">
                Jabatan / Keterangan Role
              </Label>
              <Input
                id="contact-role"
                value={formContactRole}
                onChange={(e) => setFormContactRole(e.target.value)}
                placeholder="Contoh: Gotrade Dedicated Account Support"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="contact-wa-label" className="text-xs font-semibold">
                  Platform
                </Label>
                <Input
                  id="contact-wa-label"
                  value={formContactWaLabel}
                  onChange={(e) => setFormContactWaLabel(e.target.value)}
                  placeholder="Whatsapp"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="contact-wa-num" className="text-xs font-semibold">
                  Nomor WhatsApp / Handphone
                </Label>
                <Input
                  id="contact-wa-num"
                  value={formContactWaNumber}
                  onChange={(e) => setFormContactWaNumber(e.target.value)}
                  placeholder="Contoh: 082329157278"
                  className="font-mono font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-semibold">
                Email Support (Opsional)
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={formContactEmail}
                onChange={(e) => setFormContactEmail(e.target.value)}
                placeholder="Contoh: support@gotrade.com"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Status Tampil</p>
                <p className="text-[11px] text-muted-foreground">
                  Tampilkan profil ini di halaman /lainnya trader
                </p>
              </div>
              <Switch checked={formContactActive} onCheckedChange={setFormContactActive} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsContactModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveContactModal}
              className="bg-[#00a651] text-xs text-white hover:bg-[#00a651]/90"
            >
              {editingContactItem ? "Simpan Perubahan" : "Tambahkan Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog for Add / Edit Source */}
      <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSourceItem ? "Edit Rekening / E-Wallet" : "Tambah Rekening / E-Wallet Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingSourceItem
                ? "Perbarui nama, kategori, atau status aktif sumber dana ini."
                : "Tambahkan pilihan bank atau e-wallet baru yang dapat dipilih trader saat deposit."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="source-label" className="text-xs font-semibold">
                Nama Bank / E-Wallet
              </Label>
              <Input
                id="source-label"
                value={formSourceLabel}
                onChange={(e) => setFormSourceLabel(e.target.value)}
                placeholder="Contoh: Bank Jago, SeaBank, LinkAja"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormSourceCategory("Bank")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                    formSourceCategory === "Bank"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Landmark className="h-4 w-4" /> Bank
                </button>
                <button
                  type="button"
                  onClick={() => setFormSourceCategory("E-Wallet")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                    formSourceCategory === "E-Wallet"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Smartphone className="h-4 w-4" /> E-Wallet
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Status Aktif</p>
                <p className="text-[11px] text-muted-foreground">
                  Tampilkan pilihan ini di form deposit trader
                </p>
              </div>
              <Switch checked={formSourceActive} onCheckedChange={setFormSourceActive} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSourceModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveSourceModal}
              className="bg-primary text-xs text-primary-foreground"
            >
              {editingSourceItem ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
