import React, { useState, useEffect } from "react";
import {
  Settings,
  Moon,
  Sun,
  Globe,
  Building2,
  CreditCard,
  Layers,
  Printer,
  Database,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Sliders,
  Shield,
  Plus,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  HelpCircle,
  FileText,
  Smartphone,
  QrCode,
  Edit3,
  X,
  Wallet,
  Banknote,
  AlertTriangle,
  Percent,
  Lock,
  RefreshCw,
  Cloud,
  Activity,
  Key,
  Copy,
  Check,
  LayoutTemplate,
  Palette,
  Eye,
  FileCheck,
} from "lucide-react";
import {
  Tenant,
  UserRole,
  BusinessCategory,
  CustomFieldDefinition,
  CustomFieldType,
  InvoiceTemplateConfig,
  InvoiceTemplateStyle,
  CustomPaymentMethod,
  CustomPaymentMethodType,
} from "../../types";
import { storageService } from "../../services/storageService";
import { i18n } from "../../services/i18nService";
import {
  supabaseService,
  ConnectionTestResult,
} from "../../services/supabaseClient";
import { printPosReceipt } from "../../shared/utils/printReceipt";
import { generateQrCodeSvg } from "../../shared/utils/qrCode";

interface GlobalSettingsViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onTenantUpdated?: (updatedTenant: Tenant) => void;
}

export const GlobalSettingsView: React.FC<GlobalSettingsViewProps> = ({
  activeTenant,
  activeRole,
  onTenantUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "theme"
    | "shop"
    | "templates"
    | "payment"
    | "categories"
    | "pos"
    | "footer"
    | "supabase"
    | "backup"
  >("theme");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  // Supabase Cloud DB Settings
  const [supabaseUrl, setSupabaseUrl] = useState(
    () => supabaseService.getConfig().url,
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    () => supabaseService.getConfig().anonKey,
  );
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // 1. Theme & Localization Settings
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    return (
      (localStorage.getItem("dokan_v2_theme") as "light" | "dark") || "light"
    );
  });
  const [language, setLanguage] = useState<"bn" | "en">(() => {
    return (localStorage.getItem("dokan_v2_lang") as "bn" | "en") || "bn";
  });
  const [layoutDensity, setLayoutDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );

  // Footer & Enterprise Branding Settings
  const footerSettingsKey = `dokan_footer_config_${activeTenant.id}`;
  const [footerConfig, setFooterConfig] = useState(() => {
    try {
      const stored =
        localStorage.getItem(footerSettingsKey) ||
        localStorage.getItem("dokan_footer_config");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      isEnabled: true,
      brandTitle: "SmartERP Enterprise",
      versionTag: "V2.0",
      copyrightText: "© 2026 SmartERP Enterprise. সর্বস্বত্ব সংরক্ষিত।",
      showCurrencyTimezone: true,
      currencyText: "BDT (৳)",
      timezoneText: "Asia/Dhaka (GMT+6)",
      showUserBadge: true,
      supportPhone: "+880 1700-000000",
      supportEmail: "support@smarterp.com",
      customNotice: "SmartERP Enterprise Core System • Multi-Tenant Secured",
    };
  });

  // 2. Shop Profile Settings
  const [shopName, setShopName] = useState(activeTenant.name || "");
  const [shopCode, setShopCode] = useState(activeTenant.code || "");
  const [ownerName, setOwnerName] = useState(activeTenant.owner_name || "");
  const [phone, setPhone] = useState(activeTenant.phone || "");
  const [email, setEmail] = useState(activeTenant.email || "");
  const [address, setAddress] = useState(activeTenant.address || "");
  const [currencySymbol, setCurrencySymbol] = useState(
    activeTenant.currency_symbol || "৳",
  );
  const [tinNo, setTinNo] = useState(activeTenant.tin_number || "");
  const [binNo, setBinNo] = useState(
    activeTenant.bin_number || activeTenant.vat_number || "",
  );
  const [vatRegNo, setVatRegNo] = useState(
    activeTenant.bin_number || activeTenant.vat_number || "BIN-123456789-001",
  );
  const [tagline, setTagline] = useState(activeTenant.tagline || "");
  const [pageTitleFormat, setPageTitleFormat] = useState(
    activeTenant.page_title_format || "{{page}} | {{shop}} - {{branding}}"
  );
  const [systemBranding, setSystemBranding] = useState(
    activeTenant.system_branding || "SmartERP"
  );
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState(
    "বিসমিল্লাহির রাহমানির রাহিম",
  );
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(
    "বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!",
  );

  // Sync state when activeTenant prop changes
  useEffect(() => {
    setShopName(activeTenant.name || "");
    setShopCode(activeTenant.code || "");
    setOwnerName(activeTenant.owner_name || "");
    setPhone(activeTenant.phone || "");
    setEmail(activeTenant.email || "");
    setAddress(activeTenant.address || "");
    setCurrencySymbol(activeTenant.currency_symbol || "৳");
    setTinNo(activeTenant.tin_number || "");
    setBinNo(activeTenant.bin_number || activeTenant.vat_number || "");
    setVatRegNo(activeTenant.bin_number || activeTenant.vat_number || "BIN-123456789-001");
    setTagline(activeTenant.tagline || "");
    setPageTitleFormat(activeTenant.page_title_format || "{{page}} | {{shop}} - {{branding}}");
    setSystemBranding(activeTenant.system_branding || "SmartERP");
  }, [activeTenant]);

  // Invoice & Print Template Settings
  const templateSettingsKey = `dokan_v2_template_config_${activeTenant.id}`;
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>(() => {
    try {
      const stored =
        localStorage.getItem(templateSettingsKey) ||
        localStorage.getItem("dokan_v2_template_config");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      templateStyle: "modern",
      defaultPaperSize: "80mm",
      primaryColor: "#0284c7",
      headerNote: "বিসমিল্লাহির রাহমানির রাহিম",
      footerNote: "বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!",
      termsConditions: "১. ওয়ারেন্টিযুক্ত পণ্যের ক্ষেত্রে ক্যাশ মেমো ও বক্স সংরক্ষণ বাধ্যতামূলক।\n২. সফটওয়্যার ও সার্ভিসিং সংক্রান্ত কোনো মালামাল ফেরত নেয়া হয় না।",
      showLogo: true,
      showWatermark: true,
      showQrCode: true,
      showCustomerDetails: true,
      showTinBin: true,
      showWarrantyNote: true,
      showSignatures: true,
      showSoftwareBranding: true,
      softwareBrandingText: "SmartERP Enterprise Platform V2.0",
    };
  });

  const [previewPaperFormat, setPreviewPaperFormat] = useState<
    "80mm" | "58mm" | "A4" | "A5"
  >("80mm");

  // 3. Payment Methods Settings
  const paymentSettingsKey = `dokan_v2_payment_settings_${activeTenant.id}`;
  const [paymentConfig, setPaymentConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(paymentSettingsKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      enableCash: true,
      cashOpeningBalance: 0,
      enableChangeCalculation: true,
      autoOpenCashDrawer: true,

      enableBkash: true,
      bkashNumber: "01700000000",
      bkashType: "Merchant",
      bkashTrxFeePercent: 0,
      bkashRequireTrxId: true,
      bkashQrCodeUrl: "",

      enableNagad: true,
      nagadNumber: "01800000000",
      nagadType: "Personal",
      nagadTrxFeePercent: 0,
      nagadRequireTrxId: true,

      enableRocket: true,
      rocketNumber: "01900000000",
      rocketType: "Merchant",

      enableUpay: false,
      upayNumber: "",

      enableCard: true,
      cardTerminalName: "City Bank POS",
      cardMdrPercent: 1.5,
      supportedCards: ["Visa", "Mastercard", "Nexus", "Amex"],

      enableDueCredit: true,
      maxDueLimit: 50000,
      duePaymentDays: 30,
      blockSaleIfDueOverLimit: true,
      requireCustomerPhoneForDue: true,

      enableSplitPayment: true,
      roundOffTotal: true,

      customMethods: [
        {
          id: "cpm_upay",
          code: "UPAY",
          name: "উপায় (Upay MFS)",
          type: "MFS" as CustomPaymentMethodType,
          accountNumber: "01700000000",
          accountName: "SmartERP Upay",
          chargePercent: 0,
          requireTrxId: true,
          isActive: false,
          color: "#0284c7",
          instructions: "মার্চেন্ট QR বা ক্যাশইন",
        },
        {
          id: "cpm_cellfin",
          code: "CELLFIN",
          name: "ইসলামী ব্যাংক সেলফিন (Cellfin)",
          type: "DIGITAL_WALLET" as CustomPaymentMethodType,
          accountNumber: "01700000000",
          accountName: "IBBL Cellfin Merchant",
          chargePercent: 0,
          requireTrxId: true,
          isActive: false,
          color: "#059669",
          instructions: "সেলফিন ওয়ালেট টু মার্চেন্ট ট্রান্সফার",
        },
        {
          id: "cpm_bank",
          code: "BANK_TRANSFER",
          name: "সিটি ব্যাংক ট্রান্সফার / CityTouch",
          type: "BANK" as CustomPaymentMethodType,
          accountNumber: "2050123456789",
          accountName: "SmartERP Enterprise",
          bankName: "The City Bank Limited",
          branchName: "Mirpur Branch",
          routingNumber: "225272345",
          chargePercent: 0,
          requireTrxId: true,
          isActive: false,
          color: "#4f46e5",
          instructions: "CityTouch / NPSB / BEFTN ট্রান্সফার",
        },
      ] as CustomPaymentMethod[],
    };
  });

  // Custom Payment Method Management Modal State
  const [isCustomMethodModalOpen, setIsCustomMethodModalOpen] = useState(false);
  const [editingCustomMethodId, setEditingCustomMethodId] = useState<string | null>(null);
  const [customMethodName, setCustomMethodName] = useState("");
  const [customMethodCode, setCustomMethodCode] = useState("");
  const [customMethodType, setCustomMethodType] = useState<CustomPaymentMethodType>("MFS");
  const [customAccountNumber, setCustomAccountNumber] = useState("");
  const [customAccountName, setCustomAccountName] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [customBranchName, setCustomBranchName] = useState("");
  const [customRoutingNumber, setCustomRoutingNumber] = useState("");
  const [customChargePercent, setCustomChargePercent] = useState(0);
  const [customRequireTrxId, setCustomRequireTrxId] = useState(true);
  const [customColor, setCustomColor] = useState("#0284c7");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customIsActive, setCustomIsActive] = useState(true);

  // 4. POS & Printing Preferences
  const posSettingsKey = `dokan_v2_pos_settings_${activeTenant.id}`;
  const [posConfig, setPosConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(posSettingsKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      defaultPaperSize: "80mm",
      defaultVatPercent: 0,
      minStockAlertLimit: 5,
      autoPrintOnCheckout: true,
      enableSoundEffects: true,
      barcodeFastScanMode: true,
    };
  });

  // 5. Category & Custom Properties
  const categories = storageService.getCategories();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(
    () => {
      return storageService.getCustomFields();
    },
  );

  // Custom Property State
  const [editingCustomField, setEditingCustomField] =
    useState<CustomFieldDefinition | null>(null);
  const [newPropName, setNewPropName] = useState("");
  const [newPropCode, setNewPropCode] = useState("");
  const [newPropCategory, setNewPropCategory] = useState(
    categories[0]?.id || "cat_stationery",
  );
  const [newPropType, setNewPropType] = useState<CustomFieldType>("text");
  const [newPropRequired, setNewPropRequired] = useState(false);

  // Apply Theme Mode in real-time
  useEffect(() => {
    localStorage.setItem("dokan_v2_theme", themeMode);
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(
      new CustomEvent("dokan_theme_changed", { detail: { theme: themeMode } }),
    );
  }, [themeMode]);

  // Apply Language in real-time
  useEffect(() => {
    i18n.setLanguage(language);
  }, [language]);

  // Listen for language change events from top header / external components
  useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail?.lang;
      if (newLang && (newLang === "bn" || newLang === "en") && newLang !== language) {
        setLanguage(newLang);
      }
    };
    window.addEventListener("dokan_lang_changed", handleLangChange as any);
    return () => window.removeEventListener("dokan_lang_changed", handleLangChange as any);
  }, [language]);

  const showSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Save Shop Profile
  const handleSaveShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTenant: Tenant = {
      ...activeTenant,
      name: shopName.trim() || activeTenant.name,
      code: shopCode.trim() || activeTenant.code,
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      tagline: tagline.trim(),
      page_title_format: pageTitleFormat.trim() || "{{page}} | {{shop}} - {{branding}}",
      system_branding: systemBranding.trim() || "SmartERP",
      currency_symbol: currencySymbol.trim() || "৳",
      currency:
        currencySymbol.trim() === "$"
          ? "USD"
          : currencySymbol.trim() === "€"
          ? "EUR"
          : currencySymbol.trim() === "£"
          ? "GBP"
          : currencySymbol.trim() === "₹"
          ? "INR"
          : currencySymbol.trim() === "﷼"
          ? "SAR"
          : currencySymbol.trim() === "د.إ"
          ? "AED"
          : "BDT",
      tin_number: tinNo.trim(),
      bin_number: binNo.trim(),
      vat_number: binNo.trim(),
    };

    storageService.saveTenant(updatedTenant);
    if (onTenantUpdated) onTenantUpdated(updatedTenant);
    window.dispatchEvent(
      new CustomEvent("dokan_tenant_changed", { detail: updatedTenant })
    );
    showSuccess("দোকান ও ব্যবসা প্রোফাইল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
  };

  // Save Template Configuration
  const handleSaveTemplateConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem(templateSettingsKey, JSON.stringify(templateConfig));
    localStorage.setItem("dokan_v2_template_config", JSON.stringify(templateConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_template_config_changed", { detail: templateConfig }),
    );
    showSuccess("ইনভয়েস টেমপ্লেট ও প্রিন্ট ডিজাইন সফলভাবে সংরক্ষণ করা হয়েছে!");
  };

  // Test Print Invoice Template
  const handleTestPrintTemplate = () => {
    printPosReceipt({
      shopName: activeTenant.name || "SmartERP Enterprise",
      shopAddress: activeTenant.address || "দোকান নং-১২, মিরপুর রোড, ঢাকা-১২১৬",
      shopPhone: activeTenant.phone || "০১৭০০-০০০০০০",
      shopEmail: activeTenant.email || "info@smarterp.com",
      tinNo: tinNo || "TIN-8923746192",
      binNo: binNo || "BIN-002938172-001",
      vatRegNo: binNo || "BIN-002938172-001",
      headerNote: templateConfig.headerNote || "বিসমিল্লাহির রাহমানির রাহিম",
      footerNote: templateConfig.footerNote || "বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!",
      termsNote: templateConfig.termsConditions || "",
      templateStyle: templateConfig.templateStyle,
      primaryColor: templateConfig.primaryColor,
      showLogo: templateConfig.showLogo,
      showQr: templateConfig.showQrCode,
      showWatermark: templateConfig.showWatermark,
      showSignatures: templateConfig.showSignatures,
      showTinBin: templateConfig.showTinBin,
      invoiceNo: `INV-${new Date().getFullYear()}-DEMO88`,
      date: new Date().toISOString(),
      customerName: "মো: রফিকুল ইসলাম (নমুনা গ্রাহক)",
      customerPhone: "01812-345678",
      items: [
        {
          name: "স্যামসাং গ্যালাক্সি A54 5G (8/128GB)",
          quantity: 1,
          unitPrice: 42000,
          total: 42000,
          imei: "354892019284719",
          warrantyMonths: 12,
        },
        {
          name: "ফাস্ট চার্জার 65W GaN Type-C",
          quantity: 1,
          unitPrice: 2200,
          total: 2200,
          warrantyMonths: 6,
        },
        {
          name: "প্রিমিয়াম গরিলা গ্লাস প্রোটেক্টর",
          quantity: 1,
          unitPrice: 350,
          total: 350,
        },
      ],
      subtotal: 44550,
      tax: 0,
      discount: 550,
      grandTotal: 44000,
      paidAmount: 40000,
      dueAmount: 4000,
      paymentMethod: "CASH",
      paperFormat: previewPaperFormat,
      softwareBranding: templateConfig.showSoftwareBranding ? (templateConfig.softwareBrandingText || activeTenant.system_branding || "SmartERP Enterprise Platform V2.0") : "",
    });
  };

  // Custom Payment Method Actions
  const handleOpenAddCustomMethod = (preset?: Partial<CustomPaymentMethod>) => {
    setEditingCustomMethodId(null);
    setCustomMethodName(preset?.name || "");
    setCustomMethodCode(preset?.code || "");
    setCustomMethodType(preset?.type || "MFS");
    setCustomAccountNumber(preset?.accountNumber || "");
    setCustomAccountName(preset?.accountName || "");
    setCustomBankName(preset?.bankName || "");
    setCustomBranchName(preset?.branchName || "");
    setCustomRoutingNumber(preset?.routingNumber || "");
    setCustomChargePercent(preset?.chargePercent || 0);
    setCustomRequireTrxId(preset?.requireTrxId ?? true);
    setCustomColor(preset?.color || "#0284c7");
    setCustomInstructions(preset?.instructions || "");
    setCustomIsActive(preset?.isActive ?? true);
    setIsCustomMethodModalOpen(true);
  };

  const handleOpenEditCustomMethod = (method: CustomPaymentMethod) => {
    setEditingCustomMethodId(method.id);
    setCustomMethodName(method.name);
    setCustomMethodCode(method.code);
    setCustomMethodType(method.type);
    setCustomAccountNumber(method.accountNumber || "");
    setCustomAccountName(method.accountName || "");
    setCustomBankName(method.bankName || "");
    setCustomBranchName(method.branchName || "");
    setCustomRoutingNumber(method.routingNumber || "");
    setCustomChargePercent(method.chargePercent || 0);
    setCustomRequireTrxId(method.requireTrxId ?? true);
    setCustomColor(method.color || "#0284c7");
    setCustomInstructions(method.instructions || "");
    setCustomIsActive(method.isActive);
    setIsCustomMethodModalOpen(true);
  };

  const handleSaveCustomMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMethodName.trim()) return;

    const generatedCode =
      customMethodCode.trim().toUpperCase().replace(/\s+/g, "_") ||
      customMethodName.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 15);

    const methodObj: CustomPaymentMethod = {
      id: editingCustomMethodId || `cpm_${Date.now()}`,
      code: generatedCode,
      name: customMethodName.trim(),
      type: customMethodType,
      accountNumber: customAccountNumber.trim(),
      accountName: customAccountName.trim(),
      bankName: customBankName.trim(),
      branchName: customBranchName.trim(),
      routingNumber: customRoutingNumber.trim(),
      chargePercent: customChargePercent,
      requireTrxId: customRequireTrxId,
      color: customColor,
      instructions: customInstructions.trim(),
      isActive: customIsActive,
    };

    const currentMethods: CustomPaymentMethod[] = paymentConfig.customMethods || [];
    let updatedMethods: CustomPaymentMethod[];

    if (editingCustomMethodId) {
      updatedMethods = currentMethods.map((m) =>
        m.id === editingCustomMethodId ? methodObj : m
      );
    } else {
      updatedMethods = [...currentMethods, methodObj];
    }

    const updatedConfig = {
      ...paymentConfig,
      customMethods: updatedMethods,
    };

    setPaymentConfig(updatedConfig);
    localStorage.setItem(paymentSettingsKey, JSON.stringify(updatedConfig));
    localStorage.setItem("dokan_v2_payment_settings", JSON.stringify(updatedConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_v2_payment_settings_changed", { detail: updatedConfig })
    );

    setIsCustomMethodModalOpen(false);
    showSuccess(
      editingCustomMethodId
        ? `পেমেন্ট মেথড "${customMethodName}" আপডেট করা হয়েছে!`
        : `নতুন পেমেন্ট মেথড "${customMethodName}" সফলভাবে তৈরি হয়েছে!`
    );
  };

  const handleDeleteCustomMethod = (id: string) => {
    const currentMethods: CustomPaymentMethod[] = paymentConfig.customMethods || [];
    const updatedMethods = currentMethods.filter((m) => m.id !== id);
    const updatedConfig = {
      ...paymentConfig,
      customMethods: updatedMethods,
    };

    setPaymentConfig(updatedConfig);
    localStorage.setItem(paymentSettingsKey, JSON.stringify(updatedConfig));
    localStorage.setItem("dokan_v2_payment_settings", JSON.stringify(updatedConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_v2_payment_settings_changed", { detail: updatedConfig })
    );
    showSuccess("পেমেন্ট মেথড মুছে ফেলা হয়েছে!");
  };

  const handleToggleCustomMethodActive = (id: string) => {
    const currentMethods: CustomPaymentMethod[] = paymentConfig.customMethods || [];
    const updatedMethods = currentMethods.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    const updatedConfig = {
      ...paymentConfig,
      customMethods: updatedMethods,
    };

    setPaymentConfig(updatedConfig);
    localStorage.setItem(paymentSettingsKey, JSON.stringify(updatedConfig));
    localStorage.setItem("dokan_v2_payment_settings", JSON.stringify(updatedConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_v2_payment_settings_changed", { detail: updatedConfig })
    );
  };

  // Save Payment Settings
  const handleSavePaymentConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem(paymentSettingsKey, JSON.stringify(paymentConfig));
    localStorage.setItem("dokan_v2_payment_settings", JSON.stringify(paymentConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_v2_payment_settings_changed", { detail: paymentConfig })
    );
    showSuccess("পেমেন্ট মেথড ও অ্যাকাউন্ট সেটিংস সংরক্ষিত হয়েছে!");
  };

  // Save POS & Printing Preferences
  const handleSavePosConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(posSettingsKey, JSON.stringify(posConfig));
    showSuccess("POS ও প্রিন্টিং ডিফল্ট সেটিংস সংরক্ষিত হয়েছে!");
  };

  // Save Footer & Branding Settings
  const handleSaveFooterConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(footerSettingsKey, JSON.stringify(footerConfig));
    localStorage.setItem("dokan_footer_config", JSON.stringify(footerConfig));
    window.dispatchEvent(
      new CustomEvent("dokan_footer_config_changed", { detail: footerConfig }),
    );
    showSuccess(
      "ফুটার ও এন্টারপ্রাইজ ব্র্যান্ডিং সেটিংস সফলভাবে সংরক্ষিত হয়েছে!",
    );
  };

  // Start Editing Custom Field
  const handleStartEditCustomField = (field: CustomFieldDefinition) => {
    setEditingCustomField(field);
    setNewPropName(field.name);
    setNewPropCode(field.code);
    setNewPropCategory(
      field.business_category_id || categories[0]?.id || "cat_stationery",
    );
    setNewPropType(field.field_type);
    setNewPropRequired(field.is_required || false);
  };

  // Cancel Editing Custom Field
  const handleCancelEditCustomField = () => {
    setEditingCustomField(null);
    setNewPropName("");
    setNewPropCode("");
    setNewPropRequired(false);
  };

  // Create or Update Custom Property
  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    if (editingCustomField) {
      const updatedField: CustomFieldDefinition = {
        ...editingCustomField,
        name: newPropName.trim(),
        code: newPropCode.trim() || editingCustomField.code,
        business_category_id: newPropCategory,
        field_type: newPropType,
        is_required: newPropRequired,
      };

      storageService.saveCustomField(updatedField);
      setCustomFields(storageService.getCustomFields());
      setEditingCustomField(null);
      setNewPropName("");
      setNewPropCode("");
      setNewPropRequired(false);
      showSuccess(
        `কাস্টম প্রোপার্টি "${updatedField.name}" সফলভাবে আপডেট করা হয়েছে!`,
      );
    } else {
      const code =
        newPropCode.trim() ||
        newPropName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const newField: CustomFieldDefinition = {
        id: `cf_${Date.now()}`,
        entity_type: "product",
        business_category_id: newPropCategory,
        name: newPropName.trim(),
        code,
        field_type: newPropType,
        is_required: newPropRequired,
      };

      storageService.saveCustomField(newField);
      setCustomFields(storageService.getCustomFields());
      setNewPropName("");
      setNewPropCode("");
      setNewPropRequired(false);
      showSuccess(
        `নতুন ডাইনামিক ফিল্ড "${newField.name}" সফলভাবে যুক্ত হয়েছে!`,
      );
    }
  };

  // Delete Custom Property
  const handleDeleteCustomField = (fieldId: string) => {
    if (editingCustomField?.id === fieldId) {
      handleCancelEditCustomField();
    }
    storageService.deleteCustomField(fieldId);
    setCustomFields(storageService.getCustomFields());
    showSuccess("কাস্টম প্রোপার্টি ফিল্ড মুছে ফেলা হয়েছে!");
  };

  // Full Store Data Backup Download
  const handleDownloadBackup = () => {
    const fullBackup = {
      version: "2.0.0",
      exportDate: new Date().toISOString(),
      tenant: activeTenant,
      products: storageService.getProducts(activeTenant.id),
      sales: storageService.getSales(activeTenant.id),
      customers: storageService.getCustomers(activeTenant.id),
      suppliers: storageService.getSuppliers(activeTenant.id),
      customFields: storageService.getCustomFields(),
      paymentSettings: paymentConfig,
      posSettings: posConfig,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DokanManager_Backup_${activeTenant.code || "shop"}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("দোকানের সম্পূর্ণ ডাটা ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!");
  };

  // Restore Backup File
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products && Array.isArray(data.products)) {
          data.products.forEach((p: any) => storageService.saveProduct(p));
        }
        if (data.customers && Array.isArray(data.customers)) {
          data.customers.forEach((c: any) => storageService.saveCustomer(c));
        }
        showSuccess("ব্যাকআপ ফাইল থেকে সফলভাবে ডাটা রিস্টোর সম্পন্ন হয়েছে!");
      } catch (err) {
        alert(
          "ভুল ফরম্যাটের ব্যাকআপ ফাইল! অনুগ্রহ করে সঠিক JSON ফাইল আপলোড করুন।",
        );
      }
    };
    reader.readAsText(file);
  };

  // Supabase Actions
  const handleTestSupabaseConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await supabaseService.testConnection(
        supabaseUrl,
        supabaseAnonKey,
      );
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        connected: false,
        latencyMs: 0,
        message: err?.message || "কানেকশন ব্যর্থ হয়েছে",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.saveConfig(supabaseUrl, supabaseAnonKey);
    setSaveSuccessMessage(
      "Supabase ক্লাউড ডেটাবেজ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!",
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleSyncToCloud = async () => {
    if (!activeTenant?.id) {
      alert("সিঙ্ক করার জন্য কোনো active tenant নির্বাচন করা নেই।");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await supabaseService.syncToCloud(activeTenant);
      if (res.success) {
        setSaveSuccessMessage(res.message);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(`সিঙ্ক ত্রুটি: ${e?.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    }
  };

  const handleCopySchema = () => {
    const schemaSql = `-- SmartERP Supabase Complete SQL Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  currency VARCHAR(16) DEFAULT 'BDT',
  currency_symbol VARCHAR(8) DEFAULT '৳',
  address TEXT DEFAULT 'ঢাকা, বাংলাদেশ',
  tagline TEXT,
  page_title_format TEXT,
  system_branding VARCHAR(128) DEFAULT 'SmartERP',
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Categories & Custom Fields
CREATE TABLE IF NOT EXISTS business_categories (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(64),
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id VARCHAR(64) PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL,
  field_name VARCHAR(128) NOT NULL,
  field_code VARCHAR(128) NOT NULL,
  field_type VARCHAR(32) DEFAULT 'text',
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  business_category_id VARCHAR(64),
  code VARCHAR(64) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  barcode VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_name VARCHAR(128) NOT NULL,
  brand VARCHAR(128),
  unit VARCHAR(32) DEFAULT 'পিস',
  purchase_price NUMERIC(15, 2) DEFAULT 0.00,
  selling_price NUMERIC(15, 2) NOT NULL,
  wholesale_price NUMERIC(15, 2),
  stock_quantity NUMERIC(15, 2) DEFAULT 0,
  min_stock_alert NUMERIC(15, 2) DEFAULT 5,
  tracking_mode VARCHAR(64) DEFAULT 'TRACKING_QUANTITY',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customers & CRM Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  membership_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  loyalty_points NUMERIC(15, 2) DEFAULT 0,
  due_balance NUMERIC(15, 2) DEFAULT 0.00,
  credit_limit NUMERIC(15, 2) DEFAULT 50000.00,
  total_spent NUMERIC(15, 2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Suppliers & Vendor Ledger
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  due_payable NUMERIC(15, 2) DEFAULT 0.00,
  total_purchased NUMERIC(15, 2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sales Transactions & Invoices
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id VARCHAR(64),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(64),
  items JSONB NOT NULL,
  subtotal NUMERIC(15, 2) NOT NULL,
  discount_amount NUMERIC(15, 2) DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) DEFAULT 0.00,
  grand_total NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0.00,
  due_amount NUMERIC(15, 2) DEFAULT 0.00,
  payment_method VARCHAR(32) DEFAULT 'CASH',
  status VARCHAR(32) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Accounting Entries & Ledger
CREATE TABLE IF NOT EXISTS accounting_entries (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  reference_type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  debit_account VARCHAR(128) NOT NULL,
  credit_account VARCHAR(128) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64),
  user_id VARCHAR(64),
  user_name VARCHAR(255),
  user_role VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  details TEXT,
  severity VARCHAR(32) DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and simple public access policies for API
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all accounting" ON accounting_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all audit" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all categories" ON business_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all custom_fields" ON custom_field_definitions FOR ALL USING (true) WITH CHECK (true);
`;
    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const isEn = language === "en";

  // Settings Navigation Tabs with dynamic language
  const settingsTabs = [
    { id: "theme", label: isEn ? "Theme & Localization" : "থিম ও ইউজার ইন্টারফেস", icon: Sun },
    { id: "shop", label: isEn ? "Shop & Business Profile" : "দোকান ও ব্যবসা প্রোফাইল", icon: Building2 },
    { id: "templates", label: isEn ? "Invoice & Print Studio" : "টেমপ্লেট ও ইনভয়েস ডিজাইন", icon: LayoutTemplate },
    { id: "payment", label: isEn ? "Payment Methods & Accounts" : "পেমেন্ট মেথড ও অ্যাকাউন্টস", icon: CreditCard },
    {
      id: "categories",
      label: isEn ? "Categories & Custom Props" : "ক্যাটাগরি ও কাস্টম প্রোপার্টিজ",
      icon: Sliders,
    },
    { id: "pos", label: isEn ? "POS & Print Defaults" : "POS ও প্রিন্ট ডিফল্টস", icon: Printer },
    { id: "footer", label: isEn ? "Footer & Branding Settings" : "ফুটার ও ব্র্যান্ডিং সেটিংস", icon: Sparkles },
    { id: "supabase", label: isEn ? "Cloud Database & Supabase" : "ক্লাউড ডেটাবেজ ও Supabase", icon: Cloud },
    { id: "backup", label: isEn ? "Data Backup & System" : "ডাটা ব্যাকআপ ও সিস্টেম", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>{isEn ? "Global System Settings" : "গ্লোবাল অ্যাডমিন সেটিংস (Global System Settings)"}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isEn
              ? "Configure theme, language, store branding, payment channels, categories, cloud database & backup."
              : "থিম, ভাষা, দোকান প্রোফাইল, পেমেন্ট চ্যানেল, ক্যাটাগরি, ফুটার, Supabase ক্লাউড ডেটাবেজ ও ব্যাকআপ নিয়ন্ত্রণ করুন"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() =>
              setThemeMode(themeMode === "light" ? "dark" : "light")
            }
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {themeMode === "light" ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {themeMode === "light"
                ? isEn ? "Dark Mode" : "ডার্ক মোড"
                : isEn ? "Light Mode" : "লাইট মোড"}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => {
              const newLang = language === "bn" ? "en" : "bn";
              setLanguage(newLang);
              i18n.setLanguage(newLang);
            }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 cursor-pointer transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>{language === "bn" ? "বাংলা (BN)" : "English (EN)"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs - Clean Wrap Grid without horizontal scroll */}
      <div className="flex flex-wrap items-center gap-2 pb-2 text-xs border-b border-slate-200">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEME & UI LOCALIZATION                                            */}
      {/* ========================================================================= */}
      {activeTab === "theme" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Appearance Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sun className="w-4 h-4 text-indigo-600" />
              <span>ভিজ্যুয়াল থিম নির্বাচন (Color Appearance)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Light Theme Card */}
              <div
                onClick={() => setThemeMode("light")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === "light"
                    ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-full h-16 bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between mb-2">
                  <div className="w-12 h-2 bg-indigo-600 rounded" />
                  <div className="w-full h-2 bg-slate-100 rounded" />
                </div>
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>লাইট থিম (Clean Light)</span>
                  {themeMode === "light" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  উজ্জ্বল ও স্ট্যান্ডার্ড সাদা ব্যাকগ্রাউন্ড
                </p>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => setThemeMode("dark")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === "dark"
                    ? "border-indigo-600 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col justify-between mb-2">
                  <div className="w-12 h-2 bg-indigo-500 rounded" />
                  <div className="w-full h-2 bg-slate-800 rounded" />
                </div>
                <div className="font-bold flex items-center justify-between">
                  <span>ডার্ক থিম (Sleek Dark)</span>
                  {themeMode === "dark" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  চোখের জন্য আরামদায়ক ডার্ক মোড
                </p>
              </div>
            </div>
          </div>

          {/* Localization & Layout Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>সিস্টেম ভাষা ও লেআউট ডেনসিটি</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                সফটওয়্যার ভাষা (Software Language):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("bn");
                    i18n.setLanguage("bn");
                  }}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    language === "bn"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  বাংলা (Bengali - ডিফল্ট)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("en");
                    i18n.setLanguage("en");
                  }}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  English (International)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                লেআউট কমপ্যাক্টনেস (Layout Density):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutDensity("comfortable")}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    layoutDensity === "comfortable"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  স্বাভাবিক (Comfortable)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutDensity("compact")}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    layoutDensity === "compact"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  কমপ্যাক্ট (Compact POS)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHOP & BUSINESS PROFILE                                            */}
      {/* ========================================================================= */}
      {activeTab === "shop" && (
        <form
          onSubmit={handleSaveShopProfile}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs"
        >
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>দোকান পরিচিতি, লাইসেন্স ও ট্যাক্স / ভ্যাট (TIN & BIN) তথ্য</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                দোকানের নাম (Shop Name) *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                দোকান কোড / Tenant Code *
              </label>
              <input
                type="text"
                required
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                মালিকের নাম (Proprietor Name)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (Contact Phone)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ইমেইল ঠিকানা (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                মুদ্রা প্রতীক ও কারেন্সি (Currency Symbol) *
              </label>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="৳"
                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 text-center font-mono text-base focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={
                      ['৳', '$', '€', '£', '₹', '﷼', 'د.إ'].includes(currencySymbol)
                        ? currencySymbol
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setCurrencySymbol(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="৳">বাংলাদেশী টাকা (৳ - BDT)</option>
                    <option value="$">US Dollar ($ - USD)</option>
                    <option value="€">Euro (€ - EUR)</option>
                    <option value="£">British Pound (£ - GBP)</option>
                    <option value="₹">Indian Rupee (₹ - INR)</option>
                    <option value="﷼">Saudi Riyal (﷼ - SAR)</option>
                    <option value="د.إ">UAE Dirham (د.إ - AED)</option>
                    <option value="custom">অন্যান্য / কাস্টম...</option>
                  </select>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {['৳', '$', '€', '£', '₹', '﷼', 'د.إ'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCurrencySymbol(sym)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-colors cursor-pointer ${
                        currencySymbol === sym
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TIN & BIN Fields */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                TIN নম্বর (Tax Identification Number / ই-টিন)
              </label>
              <input
                type="text"
                value={tinNo}
                onChange={(e) => setTinNo(e.target.value)}
                placeholder="যেমন: TIN-8472918471"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">আয়কর ও ট্যাক্স আইডেন্টিফিকেশন নম্বর</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                BIN নম্বর (Business Identification Number / ভ্যাট নং)
              </label>
              <input
                type="text"
                value={binNo}
                onChange={(e) => {
                  setBinNo(e.target.value);
                  setVatRegNo(e.target.value);
                }}
                placeholder="যেমন: BIN-001234567-001"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">জাতীয় রাজস্ব বোর্ড (NBR) বিজনেস ও মূসক নিবন্ধন নম্বর</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ভ্যাট রেজি: নম্বর (VAT Registration)
              </label>
              <input
                type="text"
                value={vatRegNo}
                onChange={(e) => setVatRegNo(e.target.value)}
                placeholder="BIN/VAT নম্বর"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-700"
              />
              <span className="text-[10px] text-slate-400">ইনভয়েস হেডার রসিদে প্রদর্শনযোগ্য</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              দোকানের সম্পূর্ণ ঠিকানা (Address) *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="দোকান নং, মার্কেট/রোড, থানা, জেলা"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ক্যাশ মেমো হেডার নোট (Invoice Header)
              </label>
              <input
                type="text"
                value={invoiceHeaderNote}
                onChange={(e) => setInvoiceHeaderNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ক্যাশ মেমো ফুটার নির্দেশিকা (Invoice Footer)
              </label>
              <input
                type="text"
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs"
              />
            </div>
          </div>

          {/* ================================================== */}
          {/* PAGE TITLE & BROWSER TAB BRANDING ENGINE           */}
          {/* ================================================== */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 rounded-xl border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-indigo-200/80">
              <span className="font-bold text-indigo-900 text-xs flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>পেজ প্রোফাইল ও ব্রাউজার ট্যাব টাইটেল সেটিংস (Page Title & Branding Engine)</span>
              </span>
              <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 font-bold shadow-2xs">
                প্রতিটি Tenant অনুযায়ী স্বয়ংক্রিয়
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  দোকানের স্লোগান / ট্যাগলাইন (Tagline / Slogan)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="যেমন: আপনার বিশ্বস্ত গ্যাজেট ও ডিজিটাল সেবা কেন্দ্র"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400">টাইটেল এবং ইনভয়েস হেডারে ব্যবহৃত হবে</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  সিস্টেম ব্র্যান্ডিং নাম (Platform Branding)
                </label>
                <input
                  type="text"
                  value={systemBranding}
                  onChange={(e) => setSystemBranding(e.target.value)}
                  placeholder="SmartERP Enterprise"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400">সফটওয়্যারের গ্লোবাল ব্র্যান্ডিং ট্যাগ</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                পেজ টাইটেল ফরম্যাট টেমপ্লেট (Page Title Template) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={pageTitleFormat}
                  onChange={(e) => setPageTitleFormat(e.target.value)}
                  placeholder="{{page}} | {{shop}} - {{branding}}"
                  className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                <span className="text-[10px] text-slate-500 font-semibold">কুইক প্রিসেট ফরম্যাট:</span>
                {[
                  { label: 'ডিফল্ট: {{page}} | {{shop}} - {{branding}}', val: '{{page}} | {{shop}} - {{branding}}' },
                  { label: 'দোকান আগে: {{shop}} | {{page}}', val: '{{shop}} | {{page}}' },
                  { label: 'সংক্ষিপ্ত: {{page}} - {{shop}}', val: '{{page}} - {{shop}}' },
                  { label: 'ট্যাগলাইনসহ: {{shop}} - {{tagline}} ({{page}})', val: '{{shop}} - {{tagline}} ({{page}})' }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setPageTitleFormat(preset.val)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      pageTitleFormat === preset.val
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Browser Tab Preview */}
            <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center gap-2 text-xs shadow-inner">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-400 text-[10px] font-bold">লাইভ ব্রাউজার ট্যাব প্রিভিউ:</span>
              <span className="font-mono text-emerald-300 font-bold truncate">
                {pageTitleFormat
                  .replace(/{{page}}/g, 'POS কুইক বিলিং')
                  .replace(/{{shop}}/g, shopName || 'স্মার্ট দোকান')
                  .replace(/{{shop_name}}/g, shopName || 'স্মার্ট দোকান')
                  .replace(/{{branding}}/g, systemBranding || 'SmartERP')
                  .replace(/{{tagline}}/g, tagline || 'আপনার বিশ্বস্ত প্রতিষ্ঠান')}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>দোকান সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICE & PRINT TEMPLATE STUDIO                                    */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="space-y-6 text-xs">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                <span>ইনভয়েস টেমপ্লেট ও প্রিন্ট ডিজাইন স্টুডিও (Invoice & Print Studio)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ক্যাশ মেমো ও এ-ফোর ইনভয়েসের লেআউট থিম, কালার অ্যাকসেন্ট, পেপার সাইজ, হেডার-ফুটার ও পলিসি নিয়ন্ত্রণ করুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPrintTemplate}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>টেস্ট প্রিন্ট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveTemplateConfig()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>টেমপ্লেট সেটিংস সেভ করুন</span>
              </button>
            </div>
          </div>

          {/* Studio Grid: Controls on Left (7 cols), Live Preview on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Template Layout Styles */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>ইনভয়েস ডিজাইন স্টাইল নির্বাচন (Invoice Layout Styles)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "modern",
                      name: "মডার্ন ক্লিন (Modern Clean)",
                      desc: "আধুনিক মিনিমালিস্ট লেআউট ও ব্লু অ্যাকসেন্ট",
                      color: "#0284c7",
                      tag: "ডিফল্ট",
                    },
                    {
                      id: "classic",
                      name: "ক্লাসিক প্রফেশনাল (Classic Pro)",
                      desc: "ফরমাল বক্সড টেবিল ও ডার্ক স্লেট হেডার",
                      color: "#0f172a",
                      tag: "কর্পোরেট",
                    },
                    {
                      id: "thermal",
                      name: "কমপ্যাক্ট থার্মাল (Thermal POS)",
                      desc: "৮০মিমি/৫৮মিমি রোল প্রিন্টারের জন্য অপ্টিমাইজড",
                      color: "#2563eb",
                      tag: "থার্মাল",
                    },
                    {
                      id: "colorful",
                      name: "কালারফুল এন্টারপ্রাইজ (Colorful)",
                      desc: "পার্পল গ্র্যাডিয়েন্ট ও রঙিন ব্যাজ স্টাইল",
                      color: "#7c3aed",
                      tag: "ভাইব্রেন্ট",
                    },
                    {
                      id: "tax_compliant",
                      name: "ট্যাক্স ও মূসক (Tax & VAT)",
                      desc: "NBR মূসক-৬.৩ কমপ্লায়েন্স, BIN/TIN ফোকাসড",
                      color: "#047857",
                      tag: "অফিসিয়াল",
                    },
                  ].map((tpl) => {
                    const isSelected = templateConfig.templateStyle === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() =>
                          setTemplateConfig({
                            ...templateConfig,
                            templateStyle: tpl.id as InvoiceTemplateStyle,
                            primaryColor: tpl.color,
                          })
                        }
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: tpl.color }}
                            />
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {tpl.tag}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-[11px]">
                            {tpl.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                            {tpl.desc}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                          <span>{isSelected ? "সক্রিয় রয়েছে" : "সিলেক্ট করুন"}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Paper Size Defaults & Color Scheme */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>কাগজের সাইজ ও প্রাইমারি অ্যাকসেন্ট কালার</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      ডিফল্ট প্রিন্টার পেপার ফরম্যাট:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "80mm", name: "80mm POS থার্মাল" },
                        { id: "58mm", name: "58mm মিনি স্লিপ" },
                        { id: "A4", name: "A4 ফুল পেজ মেমো" },
                        { id: "A5", name: "A5 হাফ শিট মেমো" },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => {
                            setTemplateConfig({
                              ...templateConfig,
                              defaultPaperSize: fmt.id as any,
                            });
                            setPreviewPaperFormat(fmt.id as any);
                          }}
                          className={`p-2 rounded-lg font-bold text-center border cursor-pointer transition-all ${
                            templateConfig.defaultPaperSize === fmt.id
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          {fmt.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      ব্র্যান্ড অ্যাকসেন্ট কালার (Color Accent):
                    </label>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {[
                        { color: "#0284c7", name: "সায়ান ব্লু" },
                        { color: "#4f46e5", name: "ইনডিগো" },
                        { color: "#0f172a", name: "ডার্ক স্লেট" },
                        { color: "#047857", name: "এমেরাল্ড গ্রিন" },
                        { color: "#7c3aed", name: "রয়্যাল পার্পল" },
                        { color: "#e11d48", name: "রুবি রেড" },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() =>
                            setTemplateConfig({
                              ...templateConfig,
                              primaryColor: c.color,
                            })
                          }
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            templateConfig.primaryColor === c.color
                              ? "border-slate-900 scale-110 shadow-md ring-2 ring-indigo-400"
                              : "border-white hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        >
                          {templateConfig.primaryColor === c.color && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      ইনভয়েস হেডার, মোট বিল, কিউআর কোড ও টেবিল বর্ডারে এই রঙ ব্যবহৃত হবে
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Component Visibility Toggles */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>রসিদে বিভিন্ন সেকশন প্রদর্শন নিয়ন্ত্রণ (Component Toggles)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      key: "showLogo",
                      label: "দোকানের লোগো / আইকন",
                      desc: "হেডারে শপ লোগো ব্যাজ দেখান",
                    },
                    {
                      key: "showWatermark",
                      label: "ওয়াটারমার্ক স্ট্যাম্প (PAID/DUE)",
                      desc: "পরিশোধিত বা বাকি সিল স্ট্যাম্প",
                    },
                    {
                      key: "showQrCode",
                      label: "ডিজিটাল ভেরিফিকেশন QR কোড",
                      desc: "স্ক্যান করে বিল যাচাইকরণ কোড",
                    },
                    {
                      key: "showTinBin",
                      label: "TIN ও BIN / VAT নম্বর",
                      desc: "হেডারে ট্যাক্স ও ভ্যাট তথ্য দেখান",
                    },
                    {
                      key: "showCustomerDetails",
                      label: "কাস্টমার নাম ও মোবাইল",
                      desc: "বিলিং মেটায় গ্রাহকের বিবরণ",
                    },
                    {
                      key: "showWarrantyNote",
                      label: "ওয়ারেন্টি শর্তাবলী বক্স",
                      desc: "পণ্য ওয়ারেন্টির শর্তাবলী বক্স",
                    },
                    {
                      key: "showSignatures",
                      label: "গ্রাহক ও কর্তৃপক্ষের স্বাক্ষর লাইন",
                      desc: "A4 / A5 সাইজে ডুয়েল সিগনেচার",
                    },
                    {
                      key: "showSoftwareBranding",
                      label: "সফটওয়্যার প্ল্যাটফর্ম ব্র্যান্ডিং",
                      desc: "ফুটারে SmartERP প্ল্যাটফর্ম ট্যাগ",
                    },
                  ].map((item) => {
                    const isChecked = templateConfig[item.key as keyof InvoiceTemplateConfig] as boolean;
                    return (
                      <label
                        key={item.key}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setTemplateConfig({
                              ...templateConfig,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4. Notes & Policy Text Editors */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>হেডার স্লোগান, ফুটার মেসেজ ও রিটার্ন পলিসি টেক্সট</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      হেডার স্লোগান / ধর্মীয় বাণী (Header Slogan)
                    </label>
                    <input
                      type="text"
                      value={templateConfig.headerNote}
                      onChange={(e) =>
                        setTemplateConfig({
                          ...templateConfig,
                          headerNote: e.target.value,
                        })
                      }
                      placeholder="যেমন: বিসমিল্লাহির রাহমানির রাহিম"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ফুটার ধন্যবাদ ও বিদায় বার্তা (Footer Greeting)
                    </label>
                    <input
                      type="text"
                      value={templateConfig.footerNote}
                      onChange={(e) =>
                        setTemplateConfig({
                          ...templateConfig,
                          footerNote: e.target.value,
                        })
                      }
                      placeholder="যেমন: বিক্রিত পণ্য ৭ দিনের মধ্যে পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      শর্তাবলী ও পণ্য ফেরত পলিসি (Terms & Return Policy)
                    </label>
                    <textarea
                      rows={3}
                      value={templateConfig.termsConditions || ""}
                      onChange={(e) =>
                        setTemplateConfig({
                          ...templateConfig,
                          termsConditions: e.target.value,
                        })
                      }
                      placeholder="দোকানের শর্তাবলী লিখুন..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Preview Column */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs sticky top-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>লাইভ ইনভয়েস প্রিভিউ (Live Preview)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(["80mm", "58mm", "A4", "A5"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setPreviewPaperFormat(fmt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          previewPaperFormat === fmt
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Invoice Sheet */}
                <div className="bg-slate-100 p-3 rounded-xl mt-3 max-h-[75vh] overflow-y-auto border border-slate-200">
                  <div
                    className={`bg-white shadow-lg border border-slate-300 rounded-lg p-3.5 mx-auto relative overflow-hidden transition-all ${
                      previewPaperFormat === "A4"
                        ? "max-w-md text-[11px]"
                        : previewPaperFormat === "A5"
                        ? "max-w-sm text-[10.5px]"
                        : previewPaperFormat === "58mm"
                        ? "max-w-[240px] text-[9.5px]"
                        : "max-w-[290px] text-[10px]"
                    }`}
                  >
                    {/* Watermark */}
                    {templateConfig.showWatermark && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[20deg] font-black tracking-widest text-emerald-600 border-3 border-emerald-600 rounded px-4 py-1 text-2xl uppercase pointer-events-none opacity-15 whitespace-nowrap z-10">
                        PAID
                      </div>
                    )}

                    {/* Header Note */}
                    {templateConfig.headerNote && (
                      <div
                        className="text-center font-bold text-[10px] mb-1.5"
                        style={{ color: templateConfig.primaryColor }}
                      >
                        {templateConfig.headerNote}
                      </div>
                    )}

                    {/* Shop Header */}
                    <div
                      className={`flex items-center gap-2.5 pb-2 ${
                        previewPaperFormat === "80mm" || previewPaperFormat === "58mm"
                          ? "flex-col text-center"
                          : "justify-between"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          previewPaperFormat === "80mm" || previewPaperFormat === "58mm"
                            ? "flex-col text-center"
                            : ""
                        }`}
                      >
                        {templateConfig.showLogo && (
                          <div
                            className="w-9 h-9 rounded-full text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs"
                            style={{
                              background: `linear-gradient(135deg, ${templateConfig.primaryColor}, #0f172a)`,
                            }}
                          >
                            {shopName ? shopName.charAt(0).toUpperCase() : "S"}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs leading-tight">
                            {shopName || "SmartERP Enterprise"}
                          </h4>
                          <p className="text-[9.5px] text-slate-600">
                            📍 {address || "দোকান নং-১২, মিরপুর রোড, ঢাকা"}
                          </p>
                          <p
                            className="text-[9.5px] font-bold"
                            style={{ color: templateConfig.primaryColor }}
                          >
                            📞 হটলাইন: {phone || "০১৭০০-০০০০০০"}
                          </p>
                          {templateConfig.showTinBin && (tinNo || binNo) && (
                            <p className="text-[8.5px] text-slate-500 font-semibold mt-0.5">
                              {binNo && <span>BIN: <strong>{binNo}</strong></span>}
                              {binNo && tinNo && <span> • </span>}
                              {tinNo && <span>TIN: <strong>{tinNo}</strong></span>}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] ${
                          previewPaperFormat === "80mm" || previewPaperFormat === "58mm"
                            ? "w-full text-center mt-1"
                            : "text-right"
                        }`}
                      >
                        <div>
                          ইনভয়েস #:{" "}
                          <strong
                            className="font-mono"
                            style={{ color: templateConfig.primaryColor }}
                          >
                            INV-2026-DEMO88
                          </strong>
                        </div>
                        <div>তারিখ: {new Date().toLocaleDateString("en-GB")}</div>
                        {templateConfig.showCustomerDetails && (
                          <div>কাস্টমার: মো: রফিকুল ইসলাম</div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-1.5"></div>

                    {/* Table */}
                    <table className="w-full text-left border-collapse my-1 text-[9.5px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-bold">
                          <th className="p-0.5 text-center w-5">SL</th>
                          <th className="p-0.5">আইটেম</th>
                          <th className="p-0.5 text-center w-6">পরিমাণ</th>
                          <th className="p-0.5 text-right w-12">দর (৳)</th>
                          <th className="p-0.5 text-right w-12">মোট (৳)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-0.5 text-center text-slate-400">১</td>
                          <td className="p-0.5">
                            <strong>Samsung Galaxy A54</strong>
                            <div className="text-[8px] text-purple-700 font-mono">
                              IMEI: 354892019284719
                            </div>
                            {templateConfig.showWarrantyNote && (
                              <div
                                className="text-[8px] font-bold"
                                style={{ color: templateConfig.primaryColor }}
                              >
                                🛡️ ১২ মাস ওয়ারেন্টি
                              </div>
                            )}
                          </td>
                          <td className="p-0.5 text-center font-bold">১</td>
                          <td className="p-0.5 text-right font-mono">৪২,০০০</td>
                          <td className="p-0.5 text-right font-mono font-bold">৪২,০০০</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-0.5 text-center text-slate-400">২</td>
                          <td className="p-0.5">Fast Charger 65W GaN</td>
                          <td className="p-0.5 text-center font-bold">১</td>
                          <td className="p-0.5 text-right font-mono">২,২০০</td>
                          <td className="p-0.5 text-right font-mono font-bold">২,২০০</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-slate-300 my-1.5"></div>

                    {/* Summary & QR */}
                    <div
                      className={`flex justify-between items-end gap-2 my-1 ${
                        previewPaperFormat === "80mm" || previewPaperFormat === "58mm"
                          ? "flex-col-reverse items-stretch"
                          : ""
                      }`}
                    >
                      {templateConfig.showQrCode ? (
                        <div className="p-1 bg-white border border-slate-200 rounded text-center shrink-0 mx-auto">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: generateQrCodeSvg(
                                `Invoice: DEMO88 | ${shopName || "SmartERP"} | ৳44,000`,
                                52,
                              ),
                            }}
                          />
                          <span className="block text-[7px] text-slate-400 font-mono mt-0.5">
                            Scan to Verify
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="space-y-0.5 text-right text-[9.5px]">
                        <div className="flex justify-between text-slate-500 gap-4">
                          <span>সাবটোটাল:</span>
                          <span className="font-mono">৳৪৪,২০০.০০</span>
                        </div>
                        <div className="flex justify-between text-rose-600 gap-4">
                          <span>ছাড় (Discount):</span>
                          <span className="font-mono">-৳২০০.০০</span>
                        </div>
                        <div
                          className="flex justify-between font-black text-[11px] border-t border-b border-slate-300 py-0.5 my-0.5 gap-4"
                          style={{ color: templateConfig.primaryColor }}
                        >
                          <span>মোট বিল:</span>
                          <span className="font-mono">৳৪৪,০০০.০০</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold gap-4">
                          <span>পরিশোধিত (Paid):</span>
                          <span className="font-mono">৳৪৪,০০০.০০</span>
                        </div>
                      </div>
                    </div>

                    {/* Policy Box */}
                    {templateConfig.termsConditions && (
                      <div className="p-1 bg-slate-50 border border-dashed border-slate-200 rounded text-[8px] text-slate-500 my-1.5 whitespace-pre-line leading-tight">
                        <strong>শর্তাবলী:</strong><br />
                        {templateConfig.termsConditions}
                      </div>
                    )}

                    {/* Signatures */}
                    {templateConfig.showSignatures &&
                      (previewPaperFormat === "A4" || previewPaperFormat === "A5") && (
                        <div className="flex justify-between pt-7 pb-1 text-[9px] text-slate-500 font-semibold">
                          <div className="w-24 text-center border-t border-dashed border-slate-400 pt-1">
                            গ্রাহকের স্বাক্ষর
                          </div>
                          <div className="w-24 text-center border-t border-dashed border-slate-400 pt-1">
                            কর্তৃপক্ষের স্বাক্ষর
                          </div>
                        </div>
                      )}

                    {/* Footer */}
                    <div className="text-center pt-2 text-[8.5px] text-slate-500">
                      <p className="font-bold text-slate-700">{templateConfig.footerNote}</p>
                      {templateConfig.showSoftwareBranding && (
                        <p className="font-mono text-[7.5px] text-slate-400 mt-0.5">
                          {templateConfig.softwareBrandingText || "SmartERP Enterprise Platform V2.0"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADVANCED PAYMENT METHODS & POS GATEWAYS                            */}
      {/* ========================================================================= */}
      {activeTab === "payment" && (
        <form onSubmit={handleSavePaymentConfig} className="space-y-5 text-xs">
          {/* Header Card with Quick Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>
                  পেমেন্ট মেথড ও অ্যাকাউন্ট কনফিগারেশন (POS Payment Gateways)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ক্যাশ, এমএফএস (বিকাশ, নগদ, রকেট), ব্যাংক কার্ড ও কাস্টমার বাকির
                খাতার পলিসি নিয়ন্ত্রণ করুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {
                    [
                      paymentConfig.enableCash,
                      paymentConfig.enableBkash,
                      paymentConfig.enableNagad,
                      paymentConfig.enableRocket,
                      paymentConfig.enableCard,
                      paymentConfig.enableDueCredit,
                    ].filter(Boolean).length
                  }{" "}
                  টি মেথড সক্রিয়
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. CASH ON COUNTER */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableCash ? "bg-white border-emerald-200 shadow-xs" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      ১. কাউন্টার ক্যাশ (Cash on Counter)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      নগদ টাকা গ্রহণ ও ক্যাশ ড্রয়ার
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableCash}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableCash: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {paymentConfig.enableCash && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        প্রারম্ভিক ক্যাশ ড্রয়ার (Opening Float ৳)
                      </label>
                      <input
                        type="number"
                        value={paymentConfig.cashOpeningBalance || 0}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            cashOpeningBalance: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        ক্যাশ ড্রয়ার অটো-ওপেন
                      </label>
                      <select
                        value={paymentConfig.autoOpenCashDrawer ? "YES" : "NO"}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            autoOpenCashDrawer: e.target.value === "YES",
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="YES">সক্রিয় (Auto Open)</option>
                        <option value="NO">নিষ্ক্রিয়</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.enableChangeCalculation ?? true}
                      onChange={(e) =>
                        setPaymentConfig({
                          ...paymentConfig,
                          enableChangeCalculation: e.target.checked,
                        })
                      }
                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                    />
                    <span>
                      কাস্টমার প্রদত্ত টাকা থেকে ফেরত হিসাব স্বয়ংক্রিয় গণনা
                      (Change Return Calc)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. BKASH MFS GATEWAY */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableBkash ? "bg-white border-pink-200 shadow-xs ring-1 ring-pink-100" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs">
                    bK
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-950">
                      ২. বিকাশ পেমেন্ট (bKash Gateway)
                    </h4>
                    <span className="text-[10px] text-pink-600 font-semibold">
                      মার্চেন্ট কিউআর ও পার্সোনাল MFS
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableBkash}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableBkash: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {paymentConfig.enableBkash && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        বিকাশ মোবাইল নম্বর *
                      </label>
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={paymentConfig.bkashNumber}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bkashNumber: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-pink-50/40 border border-pink-300 rounded-lg font-mono font-bold text-pink-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        অ্যাকাউন্ট টাইপ
                      </label>
                      <select
                        value={paymentConfig.bkashType}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bkashType: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-pink-300 rounded-lg font-bold text-pink-900"
                      >
                        <option value="Merchant">
                          মার্চেন্ট কিউআর (Merchant QR)
                        </option>
                        <option value="Personal">পার্সোনাল (Send Money)</option>
                        <option value="Agent">এজেন্ট ক্যাশআউট (Agent)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        ট্রানজেকশন ফি (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0%"
                        value={paymentConfig.bkashTrxFeePercent || 0}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bkashTrxFeePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        TrxID এন্ট্রি
                      </label>
                      <select
                        value={
                          paymentConfig.bkashRequireTrxId
                            ? "REQUIRED"
                            : "OPTIONAL"
                        }
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            bkashRequireTrxId: e.target.value === "REQUIRED",
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="REQUIRED">বাধ্যতামূলক (Required)</option>
                        <option value="OPTIONAL">ঐচ্ছিক (Optional)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. NAGAD MFS GATEWAY */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableNagad ? "bg-white border-amber-200 shadow-xs ring-1 ring-amber-100" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    নগদ
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950">
                      ৩. নগদ পেমেন্ট (Nagad Gateway)
                    </h4>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      ডাকবিভাগ ডিজিটাল ওয়ালেট
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableNagad}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableNagad: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {paymentConfig.enableNagad && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        নগদ মোবাইল নম্বর *
                      </label>
                      <input
                        type="text"
                        placeholder="018XXXXXXXX"
                        value={paymentConfig.nagadNumber}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            nagadNumber: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-300 rounded-lg font-mono font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        অ্যাকাউন্ট টাইপ
                      </label>
                      <select
                        value={paymentConfig.nagadType}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            nagadType: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-amber-900"
                      >
                        <option value="Merchant">
                          মার্চেন্ট কিউআর (Merchant QR)
                        </option>
                        <option value="Personal">পার্সোনাল (Send Money)</option>
                        <option value="Agent">
                          উদ্যোক্তা ক্যাশআউট (Uddokta)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        ট্রানজেকশন ফি (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0%"
                        value={paymentConfig.nagadTrxFeePercent || 0}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            nagadTrxFeePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        TrxID এন্ট্রি
                      </label>
                      <select
                        value={
                          paymentConfig.nagadRequireTrxId
                            ? "REQUIRED"
                            : "OPTIONAL"
                        }
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            nagadRequireTrxId: e.target.value === "REQUIRED",
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="REQUIRED">বাধ্যতামূলক (Required)</option>
                        <option value="OPTIONAL">ঐচ্ছিক (Optional)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. ROCKET & UPAY MFS */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableRocket ? "bg-white border-purple-200 shadow-xs" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-950">
                      ৪. রকেট ও অন্যান্য MFS (DBBL Rocket)
                    </h4>
                    <span className="text-[10px] text-purple-600 font-semibold">
                      ১২-ডিজিট রকেট অ্যাকাউন্ট ও উপায়
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableRocket}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableRocket: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700"></div>
                </label>
              </div>

              {paymentConfig.enableRocket && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        রকেট অ্যাকাউন্ট নম্বর (১২ ডিজিট)
                      </label>
                      <input
                        type="text"
                        placeholder="019XXXXXXXX-X"
                        value={paymentConfig.rocketNumber}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            rocketNumber: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg font-mono font-bold text-purple-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        রকেট ধরন
                      </label>
                      <select
                        value={paymentConfig.rocketType || "Merchant"}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            rocketType: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg font-bold"
                      >
                        <option value="Merchant">
                          মার্চেন্ট (Merchant QR)
                        </option>
                        <option value="Personal">পার্সোনাল</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. BANK CARD & POS TERMINAL */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableCard ? "bg-white border-blue-200 shadow-xs" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">
                      ৫. ব্যাংক কার্ড ও POS মেশিন (Bank POS)
                    </h4>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      Visa, MasterCard, DBBL Nexus, Amex
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableCard}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableCard: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {paymentConfig.enableCard && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        ব্যাংক কার্ড টার্মিনাল নাম *
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: City Bank POS, BRAC Bank, NexusPay"
                        value={paymentConfig.cardTerminalName}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            cardTerminalName: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        কার্ড সোয়াইপ চার্জ (MDR %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="1.5%"
                        value={paymentConfig.cardMdrPercent || 0}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            cardMdrPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px] border border-blue-200">
                      💳 Visa
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-bold text-[10px] border border-rose-200">
                      💳 MasterCard
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px] border border-emerald-200">
                      💳 DBBL Nexus
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-bold text-[10px] border border-indigo-200">
                      💳 Amex
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. CUSTOMER CREDIT / DUE LEDGER */}
            <div
              className={`p-4 rounded-xl border transition-all ${paymentConfig.enableDueCredit ? "bg-white border-rose-200 shadow-xs ring-1 ring-rose-100" : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-950">
                      ৬. কাস্টমার বাকি ও দেনা খাতা (Credit Due Policy)
                    </h4>
                    <span className="text-[10px] text-rose-600 font-semibold">
                      গ্রাহক বাকি লিমিট ও রিমাইন্ডার কন্ট্রোল
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableDueCredit}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        enableDueCredit: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {paymentConfig.enableDueCredit && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        সর্বোচ্চ বকেয়া লিমিট (Max Credit ৳)
                      </label>
                      <input
                        type="number"
                        value={paymentConfig.maxDueLimit}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            maxDueLimit: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-rose-50/40 border border-rose-300 rounded-lg font-mono font-bold text-rose-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        বাকি পরিশোধের সর্বোচ্চ দিন (Term)
                      </label>
                      <input
                        type="number"
                        value={paymentConfig.duePaymentDays || 30}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            duePaymentDays: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.blockSaleIfDueOverLimit ?? true}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            blockSaleIfDueOverLimit: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                      <span>
                        লিমিট অতিক্রম করলে স্বয়ংক্রিয়ভাবে নতুন বাকি বিক্রয় ব্লক
                        করুন (Strict Check)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          paymentConfig.requireCustomerPhoneForDue ?? true
                        }
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            requireCustomerPhoneForDue: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                      <span>
                        কাস্টমার মোবাইল নম্বর ছাড়া বাকি বিক্রয় নিষিদ্ধ (Customer
                        Verification)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: CUSTOM PAYMENT METHODS STUDIO                                  */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>৭. কাস্টম ও নতুন পেমেন্ট মেথড (Custom Payment Methods Studio)</span>
                    <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] px-2 py-0.2 rounded-full border border-indigo-200">
                      {(paymentConfig.customMethods || []).length} টি তৈরি করা আছে
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    উপায়, ইসলামী ব্যাংক সেলফিন, সিটিটাচ, আস্থা, চেক বা নিজস্ব কাস্টম অ্যাকাউন্ট যুক্ত করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddCustomMethod()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন মেথড যুক্ত করুন</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                ⚡ দ্রুত প্রি-সেট থেকে তৈরি করুন:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    name: "উপায় (Upay MFS)",
                    code: "UPAY",
                    type: "MFS" as CustomPaymentMethodType,
                    color: "#0284c7",
                    instructions: "মার্চেন্ট QR বা পার্সোনাল ক্যাশইন",
                  },
                  {
                    name: "ইসলামী ব্যাংক সেলফিন (Cellfin)",
                    code: "CELLFIN",
                    type: "DIGITAL_WALLET" as CustomPaymentMethodType,
                    color: "#059669",
                    instructions: "সেলফিন ওয়ালেট / কিউআর ট্রান্সফার",
                  },
                  {
                    name: "সিটি ব্যাংক সিটিটাচ (CityTouch)",
                    code: "CITY_TOUCH",
                    type: "BANK" as CustomPaymentMethodType,
                    color: "#4f46e5",
                    instructions: "NPSB / BEFTN / CityTouch ট্রান্সফার",
                  },
                  {
                    name: "ব্র্যাক ব্যাংক আস্থা (Astha Banking)",
                    code: "BRAC_ASTHA",
                    type: "BANK" as CustomPaymentMethodType,
                    color: "#0284c7",
                    instructions: "Astha অ্যাপের মাধ্যমে ফান্ড ট্রান্সফার",
                  },
                  {
                    name: "চেক ও ব্যাংক ড্রাফট (Cheque)",
                    code: "CHEQUE",
                    type: "CHEQUE" as CustomPaymentMethodType,
                    color: "#475569",
                    instructions: "ব্যাংক চেক ও ক্লিয়ারিং জমা",
                  },
                  {
                    name: "ট্যাপ ওয়ালেট (Tap MFS)",
                    code: "TAP",
                    type: "MFS" as CustomPaymentMethodType,
                    color: "#e11d48",
                    instructions: "Tap ওয়ালেট মার্চেন্ট পেমেন্ট",
                  },
                  {
                    name: "গিফট ভাউচার / স্টোর ক্রেডিট",
                    code: "VOUCHER",
                    type: "OTHER" as CustomPaymentMethodType,
                    color: "#7c3aed",
                    instructions: "দোকানের গিফট কার্ড বা কুপন কোড",
                  },
                ].map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleOpenAddCustomMethod(preset)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Payment Methods List */}
            {(!paymentConfig.customMethods || paymentConfig.customMethods.length === 0) ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-700">কোনো কাস্টম পেমেন্ট মেথড তৈরি করা নেই</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  উপরের "+ নতুন মেথড যুক্ত করুন" বাটনে ক্লিক করে আপনার প্রয়োজনীয় ব্যাংক, ওয়ালেট বা চেক মেথড যুক্ত করুন
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentConfig.customMethods.map((cm) => (
                  <div
                    key={cm.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      cm.isActive
                        ? "bg-white border-slate-200 shadow-xs"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: cm.color || "#0284c7" }}
                        >
                          {cm.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-slate-900 text-xs">
                              {cm.name}
                            </h5>
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                              {cm.code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-indigo-700">
                              {cm.type}
                            </span>
                            {cm.accountNumber && (
                              <span className="font-mono text-slate-700">
                                📞 {cm.accountNumber}
                              </span>
                            )}
                            {cm.bankName && (
                              <span>🏦 {cm.bankName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Active Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={cm.isActive}
                          onChange={() => handleToggleCustomMethodActive(cm.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>ফি: <b>{cm.chargePercent || 0}%</b></span>
                        <span>TrxID: <b>{cm.requireTrxId ? "বাধ্যতামূলক" : "ঐচ্ছিক"}</b></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomMethod(cm)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomMethod(cm.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADVANCED MULTI-PAYMENT & ROUNDING BAR */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                উন্নত পেমেন্ট ট্রানজেকশন সেটিংস (Advanced Split & Rounding)
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-indigo-200 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={paymentConfig.enableSplitPayment ?? true}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      enableSplitPayment: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    স্প্লিট / মাল্টি-পেমেন্ট সক্রিয় (Split Payment)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    একই বিলে আংশিক ক্যাশ + আংশিক বিকাশ/কার্ড নেওয়ার সুবিধা
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-indigo-200 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={paymentConfig.roundOffTotal ?? true}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      roundOffTotal: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    মোট বিলে দশমিক রাউন্ডিং (Cash Rounding)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ভাঙতি পয়সা নিকটতম পূর্ণ ১ টাকায় রূপান্তর
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* LIVE POS CHECKOUT SIMULATION PREVIEW */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-slate-200">
                  POS কাউন্টার চেকআউট লাইভ প্রিভিউ (Live Payment Buttons)
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                ক্যাশিয়ার যেমন দেখতে পাবে
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {paymentConfig.enableCash && (
                <div className="p-2 bg-emerald-900/60 border border-emerald-500/40 rounded-lg flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      নগদ ক্যাশ
                    </span>
                    <span className="text-[9px] text-emerald-300 font-mono">
                      Cash ৳
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enableBkash && (
                <div className="p-2 bg-pink-900/60 border border-pink-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-600 flex items-center justify-center font-bold text-[9px] text-white shrink-0">
                    bK
                  </div>
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      বিকাশ ({paymentConfig.bkashType})
                    </span>
                    <span className="text-[9px] text-pink-300 font-mono">
                      {paymentConfig.bkashNumber || "017..."}
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enableNagad && (
                <div className="p-2 bg-amber-900/60 border border-amber-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center font-bold text-[9px] text-white shrink-0">
                    ন
                  </div>
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      নগদ ({paymentConfig.nagadType})
                    </span>
                    <span className="text-[9px] text-amber-300 font-mono">
                      {paymentConfig.nagadNumber || "018..."}
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enableRocket && (
                <div className="p-2 bg-purple-900/60 border border-purple-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-700 flex items-center justify-center font-bold text-[9px] text-white shrink-0">
                    R
                  </div>
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      রকেট DBBL
                    </span>
                    <span className="text-[9px] text-purple-300 font-mono">
                      {paymentConfig.rocketNumber || "019..."}
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enableCard && (
                <div className="p-2 bg-blue-900/60 border border-blue-500/40 rounded-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      {paymentConfig.cardTerminalName || "Bank Card"}
                    </span>
                    <span className="text-[9px] text-blue-300 font-mono">
                      MDR: {paymentConfig.cardMdrPercent}%
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enableDueCredit && (
                <div className="p-2 bg-rose-900/60 border border-rose-500/40 rounded-lg flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold block text-white text-xs truncate">
                      বাকি / খাতা
                    </span>
                    <span className="text-[9px] text-rose-300 font-mono">
                      Max: ৳{paymentConfig.maxDueLimit}
                    </span>
                  </div>
                </div>
              )}

              {/* Dynamic Custom Payment Methods in Live Preview */}
              {(paymentConfig.customMethods || [])
                .filter((cm) => cm.isActive)
                .map((cm) => (
                  <div
                    key={cm.id}
                    className="p-2 bg-slate-800/80 border rounded-lg flex items-center gap-2"
                    style={{ borderColor: cm.color || "#0284c7" }}
                  >
                    <div
                      className="w-4 h-4 rounded text-white flex items-center justify-center font-bold text-[8px] shrink-0"
                      style={{ backgroundColor: cm.color || "#0284c7" }}
                    >
                      {cm.name.slice(0, 1)}
                    </div>
                    <div className="truncate">
                      <span className="font-bold block text-white text-xs truncate">
                        {cm.name}
                      </span>
                      <span
                        className="text-[9px] font-mono block truncate"
                        style={{ color: cm.color || "#38bdf8" }}
                      >
                        {cm.accountNumber || cm.code}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>পেমেন্ট গেটওয়ে সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM PAYMENT METHOD ADD / EDIT MODAL                                    */}
      {/* ========================================================================= */}
      {isCustomMethodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col text-xs max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: customColor }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingCustomMethodId
                      ? "পেমেন্ট মেথড সম্পাদনা করুন"
                      : "নতুন পেমেন্ট মেথড যুক্ত করুন"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    ক্যাশ, এমএফএস, ব্যাংক অ্যাকাউন্ট বা চেক মেথড কনফিগারেশন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomMethodModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMethodSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পেমেন্ট মেথডের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={customMethodName}
                    onChange={(e) => setCustomMethodName(e.target.value)}
                    placeholder="যেমন: ইসলামী ব্যাংক সেলফিন"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    মেথড কোড (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customMethodCode}
                    onChange={(e) =>
                      setCustomMethodCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))
                    }
                    placeholder="যেমন: CELLFIN, UPAY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পেমেন্ট মেথডের ধরন (Type)
                  </label>
                  <select
                    value={customMethodType}
                    onChange={(e) =>
                      setCustomMethodType(e.target.value as CustomPaymentMethodType)
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="MFS">মোবাইল ওয়ালেট (MFS)</option>
                    <option value="DIGITAL_WALLET">ডিজিটাল ওয়ালেট / অ্যাপ</option>
                    <option value="BANK">ব্যাংক ট্রান্সফার / NPSB</option>
                    <option value="CARD">ব্যাংক কার্ড / ডেবিট-ক্রেডিট</option>
                    <option value="CHEQUE">চেক / ব্যাংক ড্রাফট</option>
                    <option value="OTHER">অন্যান্য / ভাউচার</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    অ্যাকাউন্ট / মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={customAccountNumber}
                    onChange={(e) => setCustomAccountNumber(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX বা A/C No"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {(customMethodType === "BANK" || customMethodType === "CHEQUE") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ব্যাংকের নাম
                    </label>
                    <input
                      type="text"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      placeholder="যেমন: The City Bank Limited"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ব্রাঞ্চের নাম
                    </label>
                    <input
                      type="text"
                      value={customBranchName}
                      onChange={(e) => setCustomBranchName(e.target.value)}
                      placeholder="যেমন: মিরপুর ব্রাঞ্চ"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      অ্যাকাউন্ট হোল্ডারের নাম
                    </label>
                    <input
                      type="text"
                      value={customAccountName}
                      onChange={(e) => setCustomAccountName(e.target.value)}
                      placeholder="যেমন: SmartERP Enterprise"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      রাউটিং নম্বর (Routing No)
                    </label>
                    <input
                      type="text"
                      value={customRoutingNumber}
                      onChange={(e) => setCustomRoutingNumber(e.target.value)}
                      placeholder="যেমন: 225272345"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ট্রানজেকশন ফি (Charge %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={customChargePercent}
                    onChange={(e) =>
                      setCustomChargePercent(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TrxID / রেফারেন্স নম্বর
                  </label>
                  <select
                    value={customRequireTrxId ? "YES" : "NO"}
                    onChange={(e) => setCustomRequireTrxId(e.target.value === "YES")}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="YES">বাধ্যতামূলক (Required)</option>
                    <option value="NO">ঐচ্ছিক (Optional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ব্র্যান্ড কালার থিম:
                </label>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {[
                    "#0284c7",
                    "#059669",
                    "#4f46e5",
                    "#7c3aed",
                    "#e11d48",
                    "#d97706",
                    "#0f172a",
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                        customColor === c
                          ? "border-slate-900 scale-110 shadow-md ring-2 ring-indigo-400"
                          : "border-white hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {customColor === c && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  কাস্টমার নির্দেশিকা ও পেমেন্ট নোট (Instructions)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="যেমন: মার্চেন্ট কিউআর কোড স্ক্যান করে পে করুন এবং ট্রানজেকশন আইডি দিন"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customIsActive}
                    onChange={(e) => setCustomIsActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>সক্রিয় রাখুন (Active)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMethodModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingCustomMethodId ? "আপডেট করুন" : "সংরক্ষণ করুন"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CATEGORY & DYNAMIC PROPERTIES                                      */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-5">
          {/* Add / Edit Custom Field Form */}
          <form
            onSubmit={handleSaveCustomField}
            className={`p-5 rounded-xl border shadow-xs space-y-4 text-xs transition-all ${
              editingCustomField
                ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>
                  {editingCustomField
                    ? `কাস্টম প্রোপার্টি সম্পাদনা: "${editingCustomField.name}"`
                    : "নতুন কাস্টম প্রোপার্টিজ ফিল্ড যুক্ত করুন (Dynamic Product Properties)"}
                </span>
              </h3>
              {editingCustomField && (
                <button
                  type="button"
                  onClick={handleCancelEditCustomField}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>সম্পাদনা বাতিল</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ফিল্ডের নাম (বাংলা/ইংরেজি) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: লেখক / প্রকাশনী / পৃষ্ঠা সংখ্যা"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ক্যাটেগরি নির্বাচন
                </label>
                <select
                  value={newPropCategory}
                  onChange={(e) => setNewPropCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ফিল্ড টাইপ (Data Type)
                </label>
                <select
                  value={newPropType}
                  onChange={(e) =>
                    setNewPropType(e.target.value as CustomFieldType)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="text">টেক্সট (Text)</option>
                  <option value="number">সংখ্যা (Number)</option>
                  <option value="date">তারিখ (Date)</option>
                  <option value="boolean">হ্যাঁ / না (Boolean)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className={`w-full py-2 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                    editingCustomField
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {editingCustomField ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ আপডেট সংরক্ষণ</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ ফিল্ড তৈরি করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPropRequired}
                  onChange={(e) => setNewPropRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span>
                  পণ্য এন্ট্রির সময় এই প্রোপার্টি পূরণ করা বাধ্যতামূলক (Required
                  Field)
                </span>
              </label>
            </div>
          </form>

          {/* Existing Dynamic Properties List with Edit and Delete Action */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
              <span>
                বর্তমান সক্রিয় কাস্টম প্রোপার্টিজ তালিকা ({customFields.length}{" "}
                টি)
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                পেন্সিল আইকনে ক্লিক করে যেকোনো প্রোপার্টি সরাসরি এডিট করুন
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {customFields.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  কোনো কাস্টম ফিল্ড তৈরি করা হয়নি।
                </div>
              ) : (
                customFields.map((field) => {
                  const cat = categories.find(
                    (c) => c.id === field.business_category_id,
                  );
                  const isCurrentlyEditing =
                    editingCustomField?.id === field.id;

                  return (
                    <div
                      key={field.id}
                      className={`p-3.5 flex items-center justify-between transition-colors ${
                        isCurrentlyEditing
                          ? "bg-amber-50/80 border-l-4 border-l-amber-500"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{field.name}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                            {field.code}
                          </span>
                          {field.is_required && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                              আবশ্যক
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ক্যাটেগরি: <b>{cat?.name || "সকল ক্যাটেগরি"}</b> •
                          ডাটা টাইপ: <b>{field.field_type}</b>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditCustomField(field)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 font-bold text-xs ${
                            isCurrentlyEditing
                              ? "bg-amber-500 text-white"
                              : "text-indigo-600 hover:bg-indigo-50 bg-indigo-50/50"
                          }`}
                          title="প্রোপার্টি এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">এডিট</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: POS & PRINT PREFERENCES                                            */}
      {/* ========================================================================= */}
      {activeTab === "pos" && (
        <form
          onSubmit={handleSavePosConfig}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs"
        >
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>POS বিলিং ও প্রিন্টার ডিফল্ট কনফিগারেশন</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ডিফল্ট ক্যাশ মেমো ফরম্যাট
              </label>
              <select
                value={posConfig.defaultPaperSize}
                onChange={(e) =>
                  setPosConfig({
                    ...posConfig,
                    defaultPaperSize: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="80mm">
                  80mm স্ট্যান্ডার্ড থার্মাল রোল (Standard POS)
                </option>
                <option value="58mm">58mm মিনি থার্মাল রোল (Mini POS)</option>
                <option value="A4">A4 ফুল পেজ ভাউচার (Laser / Inkjet)</option>
                <option value="A5">A5 হাফ পেজ মেমো</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ডিফল্ট ভ্যাট / ট্যাক্স হার (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={posConfig.defaultVatPercent}
                onChange={(e) =>
                  setPosConfig({
                    ...posConfig,
                    defaultVatPercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                লো-স্টক এলার্ট সীমা (Min Stock Alert)
              </label>
              <input
                type="number"
                min="1"
                value={posConfig.minStockAlertLimit}
                onChange={(e) =>
                  setPosConfig({
                    ...posConfig,
                    minStockAlertLimit: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={posConfig.autoPrintOnCheckout}
                onChange={(e) =>
                  setPosConfig({
                    ...posConfig,
                    autoPrintOnCheckout: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>
                বিল সম্পন্ন হওয়ার সাথে সাথে স্বয়ংক্রিয় রসিদ প্রিন্ট উইন্ডো খুলবে
              </span>
            </label>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={posConfig.barcodeFastScanMode}
                onChange={(e) =>
                  setPosConfig({
                    ...posConfig,
                    barcodeFastScanMode: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>
                বারকোড স্ক্যানার ফাস্ট মোড (স্ক্যান করলেই সরাসরি কার্টে যোগ হবে)
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>POS ডিফল্ট সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: FOOTER & ENTERPRISE BRANDING CUSTOMIZATION                         */}
      {/* ========================================================================= */}
      {activeTab === "footer" && (
        <form
          onSubmit={handleSaveFooterConfig}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>
                  ফুটার ও এন্টারপ্রাইজ ব্র্যান্ডিং সেটিংস (Footer & Branding
                  Configuration)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                সফটওয়্যারের প্রতিটি পেজের নিচের মার্জিনের ভেতরের ফুটার টেক্সট,
                ভার্সন ট্যাগ, কপিরাইট ও সাপোর্ট তথ্য কাস্টমাইজ করুন
              </p>
            </div>

            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={footerConfig.isEnabled}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    isEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>ফুটার প্রদর্শন সক্রিয় রাখুন (Enable Footer)</span>
            </label>
          </div>

          {/* Core Brand & Copyright Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                এন্টারপ্রাইজ ব্র্যান্ড / নাম *
              </label>
              <input
                type="text"
                required
                value={footerConfig.brandTitle}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    brandTitle: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                placeholder="যেমন: দোকান ম্যানেজার ERP Enterprise"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ভার্সন ট্যাগ (Version Tag) *
              </label>
              <input
                type="text"
                required
                value={footerConfig.versionTag}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    versionTag: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                placeholder="যেমন: V2.0 Enterprise"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                কপিরাইট ও নোটিশ টেক্সট *
              </label>
              <input
                type="text"
                required
                value={footerConfig.copyrightText}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    copyrightText: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                placeholder="যেমন: © 2026 SmartERP. All rights reserved."
              />
            </div>
          </div>

          {/* Contact, Currency and Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                মুদ্রা ট্যাগ (Currency Display)
              </label>
              <input
                type="text"
                value={footerConfig.currencyText}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    currencyText: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                placeholder="BDT (৳)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                সিস্টেম টাইমজোন (Timezone)
              </label>
              <input
                type="text"
                value={footerConfig.timezoneText}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    timezoneText: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                placeholder="Asia/Dhaka (GMT+6)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                সাপোর্ট ফোন / হেল্পলাইন
              </label>
              <input
                type="tel"
                value={footerConfig.supportPhone}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    supportPhone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                placeholder="+880 1700-000000"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                সাপোর্ট ইমেইল
              </label>
              <input
                type="email"
                value={footerConfig.supportEmail}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    supportEmail: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                placeholder="support@smarterp.com"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.showCurrencyTimezone}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    showCurrencyTimezone: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>মুদ্রা, টাইমজোন ও হেল্পলাইন ফুটারে প্রদর্শন করুন</span>
            </label>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.showUserBadge}
                onChange={(e) =>
                  setFooterConfig({
                    ...footerConfig,
                    showUserBadge: e.target.checked,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>বর্তমান লগইনকৃত ইউজার ও ভূমিকা (Role Badge) দেখান</span>
            </label>
          </div>

          {/* Real-time Live Preview Card */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">
              লাইভ প্রিভিউ (Live Footer Preview):
            </span>
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl overflow-hidden shadow-inner">
              {footerConfig.isEnabled ? (
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>
                        {footerConfig.brandTitle || "SmartERP Enterprise"}
                      </span>
                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-mono text-[10px] rounded font-semibold border border-indigo-200">
                        {footerConfig.versionTag || "V2.0"}
                      </span>
                    </div>

                    {footerConfig.showCurrencyTimezone && (
                      <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                        <span>{footerConfig.currencyText || "BDT (৳)"}</span>
                        <span>•</span>
                        <span>{footerConfig.timezoneText || "Asia/Dhaka"}</span>
                        {footerConfig.supportPhone && (
                          <>
                            <span>•</span>
                            <span>📞 {footerConfig.supportPhone}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {footerConfig.showUserBadge && (
                      <span className="font-mono text-[10px] text-slate-500">
                        লগইন:{" "}
                        <b className="text-slate-800 font-semibold">
                          {ownerName || "Admin"}
                        </b>{" "}
                        <span className="text-indigo-600">(SUPER_ADMIN)</span>
                      </span>
                    )}
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {footerConfig.copyrightText || "© 2026 SmartERP"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                  (ফুটার ডিসপ্লে বর্তমানে নিষ্ক্রিয় রয়েছে)
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>ফুটার ও ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB: SUPABASE CLOUD DATABASE CONFIGURATION & LIVE TEST                     */}
      {/* ========================================================================= */}
      {activeTab === "supabase" && (
        <div className="space-y-5">
          {/* Top Info & Live Status Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base tracking-tight">
                  Supabase ক্লাউড ডেটাবেজ ইন্টিগ্রেশন
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                  PostgreSQL 15+
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Supabase ক্লাউড ডেটাবেজে সরাসরি সংযোগ স্থাপন করে আপনার দোকানের
                স্টক, সেলস, কাস্টমার বাকি ও হিসাব খাতার তথ্য রিয়েল-টাইমে ক্লাউডে
                সুরক্ষিত রাখুন।
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestSupabaseConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span>
                  {isTesting
                    ? "কানেকশন টেস্ট হচ্ছে..."
                    : "🔌 টেস্ট কানেকশন (Ping)"}
                </span>
              </button>
            </div>
          </div>

          {/* Test Result Banner */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
                testResult.connected
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              {testResult.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {testResult.connected
                    ? "🟢 ক্লাউড ডেটাবেজ কানেকশন সফল!"
                    : "🔴 কানেকশন ব্যর্থ হয়েছে"}
                </div>
                <div className="text-xs">{testResult.message}</div>
                {testResult.connected && (
                  <div className="font-mono text-[11px] text-emerald-700">
                    Latency: <b>{testResult.latencyMs}ms</b> • Server Time:{" "}
                    {testResult.details?.serverTime}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Supabase API Credentials Card */}
            <form
              onSubmit={handleSaveSupabaseConfig}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
            >
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Supabase API Credentials</span>
              </h4>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-ref.supabase.co"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Supabase ড্যাশবোর্ড {">"} Project Settings {">"} API {">"}{" "}
                  Project URL
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">
                    Supabase Anon Key (Public)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    {showAnonKey ? "হাইড করুন" : "দেখান"}
                  </button>
                </div>
                <input
                  type={showAnonKey ? "text" : "password"}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Project Settings {">"} API {">"} Project API Keys {">"} anon
                  public
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>কনফিগারেশন সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {isSyncing ? "সিঙ্ক হচ্ছে..." : "🚀 ক্লাউডে সিঙ্ক করুন"}
                  </span>
                </button>
              </div>
            </form>

            {/* SQL Schema & Migration Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Supabase SQL Table Schema</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSchema ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedSchema ? "কপি হয়েছে!" : "SQL কোড কপি"}</span>
                </button>
              </h4>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Supabase ড্যাশবোর্ডে গিয়ে <b>SQL Editor</b> ট্যাবে আপনার ডেটাবেজ
                টেবিলগুলো (Tenants, Products, Sales, Accounting, Devices,
                Batches) এক ক্লিকে তৈরি করতে পারেন।
              </p>

              <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px] h-40 overflow-y-auto space-y-1">
                <div className="text-emerald-400">
                  -- SmartERP PostgreSQL Table Schema
                </div>
                <div>CREATE TABLE IF NOT EXISTS tenants (...);</div>
                <div>CREATE TABLE IF NOT EXISTS products (...);</div>
                <div>CREATE TABLE IF NOT EXISTS sales (...);</div>
                <div>CREATE TABLE IF NOT EXISTS accounting_entries (...);</div>
                <div>CREATE TABLE IF NOT EXISTS device_items (...);</div>
                <div>CREATE TABLE IF NOT EXISTS product_batches (...);</div>
                <div>CREATE TABLE IF NOT EXISTS customers (...);</div>
                <div>CREATE TABLE IF NOT EXISTS suppliers (...);</div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 space-y-1 font-medium">
                <div>
                  💡 <b>নির্দেশনা</b>: সম্পূর্ণ স্কিমাটি প্রজেক্টের রুট ফোল্ডারে{" "}
                  <code>supabase-schema.sql</code> নামে সংরক্ষিত আছে।
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DATA BACKUP & SYSTEM MAINTENANCE                                   */}
      {/* ========================================================================= */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Backup Download Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড (Backup JSON)</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              দোকানের সমস্ত স্টক ইনভেন্টরি, সেলস হিসাব, কাস্টমার বাকির খাতা ও
              সেটিংস এক ক্লিকে অফলাইনে সুরক্ষিত ব্যাকআপ ফাইল হিসেবে ডাউনলোড করে
              রাখুন।
            </p>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ফুল ব্যাকআপ ডাউনলোড করুন (.JSON)</span>
            </button>
          </div>

          {/* Restore Backup Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>ডাটা রিস্টোর করুন (Restore From File)</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              পূর্বে ডাউনলোড করা কোনো JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত তথ্য
              পুনরায় রিস্টোর করতে পারেন।
            </p>

            <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল আপলোড করুন</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
